// module packaging: header
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
      // AMD
      define([], factory);
    } else if (typeof exports === 'object') {
      // CommonJS
      module.exports = factory();
    } else {
      // Browser globals (Note: root is window)
      root.returnExports = factory();
    }
  }(this, function () {

// TODO: figure out how to avoid manually copying worker.js

const CB_FIXED = "fixed";
const CB_LATIN = "latin";
const CB_RANDOM = "random";
const CB_COMPLETE = "complete";
/* FORM STUBS*/
const SPLIT_CHAR = "\n";
const DESIGN_TYPE = "design";

function extractChildren(input) {
    let lines = input.split(SPLIT_CHAR);
    let output = [];
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].length <= 0) {
            continue;
        }
        try {
            output.push(JSON.parse(lines[i]));
        } catch (e) {

        }
    }
    return output;
}

/* END FORM STUBS*/

// onmessage = function (e) {
//     let ret = computeDesigns(e.data.allDesigns);
//     setTimeout(() => {
//         this.postMessage({trialTables: ret.trialTables, singleDesigns: ret.metas});
//     }, 1000);
// };
//
// function computeDesigns(allDesigns) {
//     let trialTables = [];
//     let metas = [];
//     for (let i = 0; i < allDesigns.length; i++) {
//         let trialTableInformation = designToTrialTable(allDesigns[i]);
//         trialTables.push({
//             name: allDesigns[i].name,
//             id: allDesigns[i].id,
//             data: trialTableInformation.trialTable,
//             variableNames: trialTableInformation.variableNames,
//             variableShortNames: trialTableInformation.variableShortNames,
//
//         });
//         metas.push({meta: trialTableInformation.meta});
//     }
//     return {trialTables, metas};
// }

function designToTrialTable(singleDesign) {
    let blocks = singleDesign.blocks;
    let numberOfParticipants = singleDesign.participants;
    let minimumNumberOfParticipants = calculateMinParticipants(singleDesign);
    let penalty = computePenalty(minimumNumberOfParticipants, singleDesign.participants);
    let trialTable = [];
    let newTrialTable = [];
    let variableNames = [];
    let variableShortNames = [];
    let numberOfTrials = 1;

    for (let i = 0; i < blocks.length; i++) {
        let currentBlock = blocks[i];
        let blockCb = currentBlock.counterbalancing;
        let blockReplications = currentBlock.replications;
        numberOfTrials *= blockReplications;
        let independentVariables = currentBlock.independentVariables;
        let serial = currentBlock.serial;
        let allBlockLevels = [];
        for (let v = 0; v < independentVariables.length; v++) {
            let iv = independentVariables[v];
            variableNames.push(iv.name);
            variableShortNames.push(iv.id);
            let levels = [];
            for (let j = 0; j < iv.levels.length; j++) {
                let currentLevel = iv.levels[j];
                levels.push(currentLevel.value);
            }
            allBlockLevels.push(levels);
            numberOfTrials *= iv.levels.length;
        }
        let cbOrder;
        switch (blockCb) {
            case CB_LATIN:
                cbOrder = latinSquareGenerator(allBlockLevels, numberOfParticipants, blockReplications, serial);
                break;
            case CB_RANDOM:
                cbOrder = allRandomGenerator(allBlockLevels, numberOfParticipants, blockReplications, serial);
                break;
            case CB_COMPLETE:
                cbOrder = completeGenerator(allBlockLevels, numberOfParticipants, blockReplications);
                break;
            case CB_FIXED :
                cbOrder = fixedOrderGenerator(allBlockLevels, numberOfParticipants, blockReplications, serial);
                break;
            default:
                alert(`The CB Strategy ${blockCb} is unknown.`);
        }

        if (trialTable.length < 1) {
            newTrialTable = cbOrder;
        } else {
            for (let participantIdx = 0; participantIdx < trialTable.length; participantIdx++) {
                let oldConditionsPerParticipant = trialTable[participantIdx];
                let newConditionsPerParticipant = cbOrder[participantIdx];
                let conditionsPerParticipant = [];
                for (let oldConditionIdx = 0; oldConditionIdx < oldConditionsPerParticipant.length; oldConditionIdx++) {
                    for (let newConditionIdx = 0; newConditionIdx < newConditionsPerParticipant.length; newConditionIdx++) {
                        let oldConditions = oldConditionsPerParticipant[oldConditionIdx];
                        let newConditions = newConditionsPerParticipant[newConditionIdx];
                        let newCombination = oldConditions.concat(newConditions);
                        conditionsPerParticipant.push(newCombination);
                    }
                }
                newTrialTable.push(conditionsPerParticipant);
            }
        }
        trialTable = newTrialTable.slice();
        newTrialTable = [];
    }
    let timing = calculateTiming(singleDesign, numberOfTrials);
    let overallSeconds = timing.trialTimePerParticipant + timing.interTrialTimePerParticipant + timing.interBlockTimePerParticipant;
    let meta = {
        trialTable,
        variableNames,
        variableShortNames,
        singleDesignName: singleDesign.name,
        numberOfParticipants,
        minimumNumberOfParticipants,
        penalty,
        overallSeconds,
        id: singleDesign.id,
        minParticipants: minimumNumberOfParticipants,
        timePerParticipant: overallSeconds,
    };
    return {variableNames, variableShortNames, trialTable, meta};
}

function calculateTiming(singleDesign, numberOfTrials) {
    let interBlockTimePerParticipant = 0;
    let trialTimePerParticipant = 0;
    let interTrialTimePerParticipant = singleDesign.intertrialTime * numberOfTrials; // replace 1 with inter trial ti
    for (let bIdx = 0; bIdx < singleDesign.blocks.length; bIdx++) {
        let curBlock = singleDesign.blocks[bIdx];
        let totalNumberOfLevels = 1;

        for (let ivIdx = 0; ivIdx < curBlock.independentVariables.length; ivIdx++) {
            let curIv = curBlock.independentVariables[ivIdx];
            let numberOfIvLevels = curIv.levels.length;
            totalNumberOfLevels *= numberOfIvLevels;
            for (let lvlIdx = 0; lvlIdx < numberOfIvLevels; lvlIdx++) {
                let curLvl = curIv.levels[lvlIdx];
                let duration = curLvl.duration;
                trialTimePerParticipant += duration * (numberOfTrials / numberOfIvLevels);
            }
        }

        if (bIdx < (singleDesign.blocks.length - 1)) {
            interBlockTimePerParticipant += totalNumberOfLevels * singleDesign.interblockTime * curBlock.replications;
        }
    }
    return {
        trialTimePerParticipant,
        interTrialTimePerParticipant,
        interBlockTimePerParticipant,
    };
}

function calculateMinParticipants(singleDesign) {
    let minPartPerBlock = [];
    let blocks = singleDesign.blocks;

    for (let blockIdx = 0; blockIdx < blocks.length; blockIdx++) {
        let currentBlock = blocks[blockIdx];
        let blockReplications = currentBlock.replications;
        let curIVs = currentBlock.independentVariables;
        let serial = currentBlock.serial;
        let nL = 1;
        switch (currentBlock.counterbalancing) {
            case CB_LATIN:
                for (let ivIdx = 0; ivIdx < curIVs.length; ivIdx++) {
                    nL *= curIVs[ivIdx].levels.length;
                }
                let numerator = nL;
                if (!serial) {
                    numerator *= blockReplications;
                }
                /*let denominator = 1;
                if (blockIdx > 0) {
                    for (let i = (blockIdx - 1); i >= 0; i--) {
                        let parentBlock = singleDesign.blocks[i];
                        let parentBlockIVs = parentBlock.independentVariables;
                        for (let j = 0; j < parentBlockIVs.length; j++) {
                            denominator *= parentBlockIVs[j].levels.length;
                        }
                    }
                    minPartPerBlock.push(Math.ceil(numerator / denominator));
                } else {
                    minPartPerBlock.push(numerator);
                }*/
                minPartPerBlock.push(numerator);
                break;
            case CB_COMPLETE:
                for (let ivIdx = 0; ivIdx < curIVs.length; ivIdx++) {
                    nL *= curIVs[ivIdx].levels.length;
                }
                let facIdx = (nL * blockReplications) - 1;
                // (1...100)! precomputed
                let factorials = [1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800, 39916800, 479001600, 6227020800, 87178291200, 1307674368000, 20922789888000, 355687428096000, 6402373705728000, 121645100408832000, 2432902008176640000, 51090942171709440000, 1124000727777607680000, 25852016738884976640000, 620448401733239439360000, 15511210043330985984000000, 403291461126605635584000000, 10888869450418352160768000000, 304888344611713860501504000000, 8841761993739701954543616000000, 265252859812191058636308480000000, 8222838654177922817725562880000000, 263130836933693530167218012160000000, 8683317618811886495518194401280000000, 295232799039604140847618609643520000000, 10333147966386144929666651337523200000000, 371993326789901217467999448150835200000000, 13763753091226345046315979581580902400000000, 523022617466601111760007224100074291200000000, 20397882081197443358640281739902897356800000000, 815915283247897734345611269596115894272000000000, 33452526613163807108170062053440751665152000000000, 1405006117752879898543142606244511569936384000000000, 60415263063373835637355132068513997507264512000000000, 2658271574788448768043625811014615890319638528000000000, 119622220865480194561963161495657715064383733760000000000, 5502622159812088949850305428800254892961651752960000000000, 258623241511168180642964355153611979969197632389120000000000, 12413915592536072670862289047373375038521486354677760000000000, 608281864034267560872252163321295376887552831379210240000000000, 30414093201713378043612608166064768844377641568960512000000000000, 1551118753287382280224243016469303211063259720016986112000000000000, 80658175170943878571660636856403766975289505440883277824000000000000, 4274883284060025564298013753389399649690343788366813724672000000000000, 230843697339241380472092742683027581083278564571807941132288000000000000, 12696403353658275925965100847566516959580321051449436762275840000000000000, 710998587804863451854045647463724949736497978881168458687447040000000000000, 40526919504877216755680601905432322134980384796226602145184481280000000000000, 2350561331282878571829474910515074683828862318181142924420699914240000000000000, 138683118545689835737939019720389406345902876772687432540821294940160000000000000, 8320987112741390144276341183223364380754172606361245952449277696409600000000000000, 507580213877224798800856812176625227226004528988036003099405939480985600000000000000, 31469973260387937525653122354950764088012280797258232192163168247821107200000000000000, 1982608315404440064116146708361898137544773690227268628106279599612729753600000000000000, 126886932185884164103433389335161480802865516174545192198801894375214704230400000000000000, 8247650592082470666723170306785496252186258551345437492922123134388955774976000000000000000, 544344939077443064003729240247842752644293064388798874532860126869671081148416000000000000000, 36471110918188685288249859096605464427167635314049524593701628500267962436943872000000000000000, 2480035542436830599600990418569171581047399201355367672371710738018221445712183296000000000000000, 171122452428141311372468338881272839092270544893520369393648040923257279754140647424000000000000000, 11978571669969891796072783721689098736458938142546425857555362864628009582789845319680000000000000000, 850478588567862317521167644239926010288584608120796235886430763388588680378079017697280000000000000000, 61234458376886086861524070385274672740778091784697328983823014963978384987221689274204160000000000000000, 4470115461512684340891257138125051110076800700282905015819080092370422104067183317016903680000000000000000, 330788544151938641225953028221253782145683251820934971170611926835411235700971565459250872320000000000000000, 24809140811395398091946477116594033660926243886570122837795894512655842677572867409443815424000000000000000000, 1885494701666050254987932260861146558230394535379329335672487982961844043495537923117729972224000000000000000000, 145183092028285869634070784086308284983740379224208358846781574688061991349156420080065207861248000000000000000000, 11324281178206297831457521158732046228731749579488251990048962825668835325234200766245086213177344000000000000000000, 894618213078297528685144171539831652069808216779571907213868063227837990693501860533361810841010176000000000000000000, 71569457046263802294811533723186532165584657342365752577109445058227039255480148842668944867280814080000000000000000000, 5797126020747367985879734231578109105412357244731625958745865049716390179693892056256184534249745940480000000000000000000, 475364333701284174842138206989404946643813294067993328617160934076743994734899148613007131808479167119360000000000000000000, 39455239697206586511897471180120610571436503407643446275224357528369751562996629334879591940103770870906880000000000000000000, 3314240134565353266999387579130131288000666286242049487118846032383059131291716864129885722968716753156177920000000000000000000, 281710411438055027694947944226061159480056634330574206405101912752560026159795933451040286452340924018275123200000000000000000000, 24227095383672732381765523203441259715284870552429381750838764496720162249742450276789464634901319465571660595200000000000000000000, 2107757298379527717213600518699389595229783738061356212322972511214654115727593174080683423236414793504734471782400000000000000000000, 185482642257398439114796845645546284380220968949399346684421580986889562184028199319100141244804501828416633516851200000000000000000000, 16507955160908461081216919262453619309839666236496541854913520707833171034378509739399912570787600662729080382999756800000000000000000000, 1485715964481761497309522733620825737885569961284688766942216863704985393094065876545992131370884059645617234469978112000000000000000000000, 135200152767840296255166568759495142147586866476906677791741734597153670771559994765685283954750449427751168336768008192000000000000000000000, 12438414054641307255475324325873553077577991715875414356840239582938137710983519518443046123837041347353107486982656753664000000000000000000000, 1156772507081641574759205162306240436214753229576413535186142281213246807121467315215203289516844845303838996289387078090752000000000000000000000, 108736615665674308027365285256786601004186803580182872307497374434045199869417927630229109214583415458560865651202385340530688000000000000000000000, 10329978488239059262599702099394727095397746340117372869212250571234293987594703124871765375385424468563282236864226607350415360000000000000000000000, 991677934870949689209571401541893801158183648651267795444376054838492222809091499987689476037000748982075094738965754305639874560000000000000000000000, 96192759682482119853328425949563698712343813919172976158104477319333745612481875498805879175589072651261284189679678167647067832320000000000000000000000, 9426890448883247745626185743057242473809693764078951663494238777294707070023223798882976159207729119823605850588608460429412647567360000000000000000000000, 933262154439441526816992388562667004907159682643816214685929638952175999932299156089414639761565182862536979208272237582511852109168640000000000000000000000, 93326215443944152681699238856266700490715968264381621468592963895217599993229915608941463976156518286253697920827223758251185210916864000000000000000000000000];
                if (facIdx > 99) {
                    sendMessage("We can only do factorials until 100. sorry!");
                    minPartPerBlock.push(0);
                } else {
                    minPartPerBlock.push(factorials[facIdx]);
                }
                break;
            default:
                minPartPerBlock.push(1);
        }
    }
    return lcm(minPartPerBlock);
}

function computePenalty(minNumParticipants, currentParticipants) {
    let penalty = currentParticipants / minNumParticipants;
    if (penalty > 1) {
        penalty = 1;
    }
    penalty = Math.round(penalty * 10000) / 100;
    return penalty;
}

function cartesian(arg) { // also used for fixed order
    let r = [], max = arg.length - 1;

    function helper(arr, i) {
        for (let j = 0, l = arg[i].length; j < l; j++) {
            let a = arr.slice(0); // clone arr
            a.push(arg[i][j]);
            if (i === max)
                r.push(a);
            else
                helper(a, i + 1);
        }
    }

    helper([], 0);
    return r;
}

function fixedOrderGenerator(allBlockLevels, numberOfParticipants, blockReplications, serial) {
    let permutations = cartesian(allBlockLevels);
    let replicatedPermutations = [];
    let ret = [];
    if (serial) {
        for (let i = 0; i < permutations.length; i++) {
            for (let j = 0; j < blockReplications; j++) {
                replicatedPermutations.push(permutations[i]);
            }
        }
    } else {
        for (let j = 0; j < blockReplications; j++) {
            for (let i = 0; i < permutations.length; i++) {
                replicatedPermutations.push(permutations[i]);
            }
        }
    }
    for (let i = 0; i < numberOfParticipants; i++) {
        ret.push(replicatedPermutations.slice());
    }
    return ret;
}

function allRandomGenerator(allBlockLevels, numberOfParticipants, blockReplications, serial) {
    let permutations = cartesian(allBlockLevels);
    let replicatedPermutations = [];
    let ret = [];

    if (serial) {
        permutations = shuffle(permutations);
        for (let i = 0; i < permutations.length; i++) {
            for (let j = 0; j < blockReplications; j++) {
                replicatedPermutations.push(permutations[i]);
            }
        }
        for (let i = 0; i < numberOfParticipants; i++) {
            ret.push(replicatedPermutations.slice());
        }
    } else {
        for (let i = 0; i < permutations.length; i++) {
            for (let j = 0; j < blockReplications; j++) {
                replicatedPermutations.push(permutations[i]);
            }
        }
        for (let i = 0; i < numberOfParticipants; i++) {
            ret.push(shuffle(replicatedPermutations.slice()));
        }
    }
    return ret;
}

function latinSquareGenerator(allBlockLevels, numberOfParticipants, blockReplications, serial) {
    let permutations = cartesian(allBlockLevels);
    let ret = [];
    let permutationsWithReplications = [];
    let iterator = 1;
    if (!serial) {
        for (let i = 0; i < blockReplications; i++) {
            for (let j = 0; j < permutations.length; j++) {
                permutationsWithReplications.push(permutations[j]);
            }
        }
        iterator = blockReplications;
    } else {
        permutationsWithReplications = permutations;
    }

    let size = permutationsWithReplications.length;

    let rollingLatinSquare = [];
    // generate normal / rolling Latin square
    rollingLatinSquare.push(permutationsWithReplications);
    for (let i = 1; i < size; i++) {
        let nextRow = rollingLatinSquare[i - 1].slice();
        let firstElement = nextRow.shift();
        nextRow.push(firstElement);
        rollingLatinSquare.push(nextRow);
    }


    // reorder Latin square
    let numberPool = [];
    for (let i = 0; i < permutations.length; i++) {
        numberPool.push(i);
    }
    // reorder rows
    let rowIterator = 0;
    let rowsPermuted = new Array(size);
    for (let j = 0; j < iterator; j++) {
        let shuffledNumberPool = shuffle(numberPool);
        while (rowIterator < (permutations.length * (j + 1))) {
            let newRowIndex = shuffledNumberPool.shift();
            rowsPermuted[newRowIndex + permutations.length * j] = rollingLatinSquare[rowIterator].slice();
            rowIterator++;
        }
    }

    // define an empty 2D array
    let columnsPermuted = [];
    for (let r = 0; r < rowsPermuted.length; r++) {
        columnsPermuted.push([]);
        for (let c = 0; c < rowsPermuted[r].length; c++) {
            columnsPermuted[r].push([]);
        }
    }
    let shuffledNumberPools = [];
    let shuffledNumberPool = numberPool;
    for (let i = 0; i < iterator; i++) {
        shuffledNumberPool = shuffle(shuffledNumberPool);
        shuffledNumberPools.push(shuffledNumberPool.slice());
    }

    // reorder columns
    for (let i = 0; i < size; i++) {
        let columnIterator = 0;
        for (let v = 0; v < iterator; v++) {
            let shuffledNumberTmp = shuffledNumberPools[v].slice();
            while (columnIterator < (permutations.length * (v + 1))) {
                let newColumnIndex = shuffledNumberTmp.shift();
                columnsPermuted[i][newColumnIndex + permutations.length * v] = rollingLatinSquare[i][columnIterator].slice();
                columnIterator++;
            }
        }
    }

    let i = 0;
    while (ret.length < numberOfParticipants) {
        if (i === size) {
            i = 0;
        }
        ret.push(columnsPermuted[i].slice());
        i++;
    }
    let infinityLoopStopper = 0;
    let limit = 10000;
    // consecutive trial algorithm
    let errorIndex = noTwoConsecutiveTrials(ret);
    while (errorIndex !== true) {
        if (infinityLoopStopper > limit) {
            break;
        }
        for (let participantIdx = 0; participantIdx < ret.length; participantIdx++) {
            let trialsPerParticipant = ret[participantIdx];
            let duplicateRow = trialsPerParticipant[errorIndex].slice();
            if (errorIndex === (trialsPerParticipant.length - 1)) {
                let newRow = trialsPerParticipant[0].slice();
                trialsPerParticipant[0] = duplicateRow;
                trialsPerParticipant[errorIndex] = newRow;
            } else {
                let newRow = trialsPerParticipant[errorIndex + 1].slice();
                trialsPerParticipant[errorIndex + 1] = duplicateRow;
                trialsPerParticipant[errorIndex] = newRow;
            }
        }
        errorIndex = noTwoConsecutiveTrials(ret);
        infinityLoopStopper++;
    }
    if (infinityLoopStopper >= limit) {
        self.console.debug(`There was an infinity loop.`);
    }
    if (serial && blockReplications > 1) {
        let retWithReps = [];
        for (let participantIdx = 0; participantIdx < ret.length; participantIdx++) {
            let trialsPerParticipant = ret[participantIdx];
            let newTrialsPerParticipant = [];
            for (let trialIdx = 0; trialIdx < trialsPerParticipant.length; trialIdx++) {
                let curTrial = trialsPerParticipant[trialIdx];
                for (let j = 0; j < blockReplications; j++) {
                    newTrialsPerParticipant.push(curTrial);
                }
            }
            retWithReps.push(newTrialsPerParticipant.slice());
        }
        ret = retWithReps.slice();
    }

    // TODO Serial has been removed, check!

    return ret;
}

function completeGenerator(allBlockLevels, numberOfParticipants, blockRepetitions) {

    // TODO: Complete generator doesn't take number of block replications into account. The output always have one replication.
    const numberOfTotalLevels = allBlockLevels.reduce((acc, cur) => acc + cur.length, 0);
    if(numberOfTotalLevels > 6){
        throw new Error("Block has too many conditions for Complete counterbalancing");
    }
    let permutations = permute(allBlockLevels);
    return permutations.slice(0, numberOfParticipants);
}

function shuffle(input) {
    // 1000 random numbers between 1 and 100
    let randomNumbers = [74, 73, 27, 81, 75, 45, 40, 24, 3, 73, 96, 55, 3, 26, 36, 57, 97, 35, 71, 77, 98, 24, 73, 63, 36, 85, 60, 12, 79, 3, 34, 32, 61, 75, 81, 35, 3, 14, 54, 20, 19, 37, 10, 45, 82, 72, 44, 41, 9, 72, 17, 17, 13, 55, 47, 77, 11, 18, 9, 21, 96, 79, 8, 3, 3, 87, 6, 20, 71, 63, 2, 85, 21, 90, 87, 85, 53, 3, 54, 26, 89, 84, 66, 65, 35, 68, 51, 77, 70, 14, 62, 9, 7, 55, 8, 14, 41, 85, 52, 28, 26, 72, 69, 27, 43, 39, 78, 6, 55, 87, 21, 5, 75, 44, 44, 91, 77, 37, 2, 61, 60, 48, 38, 52, 18, 100, 66, 5, 24, 9, 15, 74, 47, 18, 84, 100, 33, 49, 23, 14, 84, 46, 61, 79, 48, 66, 60, 78, 51, 20, 79, 47, 34, 33, 3, 32, 96, 98, 23, 32, 42, 36, 93, 69, 11, 91, 40, 25, 87, 31, 56, 57, 40, 75, 68, 94, 65, 38, 69, 52, 51, 43, 68, 8, 85, 39, 33, 82, 70, 49, 24, 80, 16, 91, 3, 90, 11, 25, 33, 87, 23, 66, 70, 16, 46, 57, 52, 0, 18, 59, 82, 24, 28, 73, 31, 80, 68, 6, 56, 61, 86, 0, 15, 75, 17, 38, 87, 13, 22, 46, 0, 38, 88, 67, 94, 43, 36, 55, 39, 47, 51, 67, 40, 25, 76, 48, 39, 46, 50, 20, 72, 67, 6, 60, 48, 84, 99, 32, 4, 68, 71, 41, 67, 78, 96, 88, 100, 82, 32, 32, 21, 81, 47, 96, 52, 60, 57, 46, 20, 83, 84, 87, 32, 75, 75, 96, 76, 30, 60, 46, 71, 92, 20, 55, 70, 5, 84, 38, 8, 60, 89, 98, 93, 33, 11, 63, 75, 52, 28, 57, 35, 75, 5, 82, 12, 100, 35, 40, 68, 82, 55, 71, 92, 93, 1, 66, 16, 33, 68, 91, 91, 19, 77, 32, 14, 22, 11, 70, 55, 0, 2, 14, 74, 96, 79, 82, 81, 8, 63, 67, 20, 34, 18, 57, 20, 73, 92, 100, 44, 72, 93, 66, 63, 68, 11, 87, 40, 98, 61, 23, 60, 98, 10, 39, 39, 9, 13, 24, 11, 86, 17, 9, 39, 64, 13, 33, 40, 35, 33, 46, 72, 76, 71, 30, 78, 12, 59, 13, 46, 48, 54, 14, 21, 78, 74, 17, 76, 23, 4, 27, 19, 39, 7, 57, 76, 15, 45, 24, 32, 84, 51, 97, 92, 37, 16, 24, 91, 89, 35, 49, 54, 34, 51, 15, 56, 19, 62, 25, 75, 75, 46, 86, 86, 31, 26, 85, 7, 34, 61, 8, 67, 88, 5, 92, 11, 54, 87, 17, 97, 19, 12, 39, 14, 59, 37, 16, 90, 21, 70, 10, 11, 10, 33, 71, 48, 44, 3, 58, 14, 69, 9, 69, 19, 48, 14, 37, 7, 59, 97, 34, 83, 84, 60, 92, 19, 98, 52, 39, 54, 19, 59, 88, 23, 71, 90, 77, 97, 16, 92, 90, 14, 19, 80, 69, 63, 73, 66, 48, 16, 56, 53, 36, 33, 86, 68, 99, 80, 26, 73, 34, 39, 30, 39, 27, 57, 21, 88, 21, 73, 93, 1, 42, 54, 62, 88, 42, 64, 42, 18, 57, 87, 45, 39, 35, 88, 81, 78, 42, 1, 68, 78, 65, 30, 66, 8, 6, 70, 14, 16, 65, 83, 43, 65, 0, 97, 45, 97, 91, 23, 62, 67, 33, 54, 92, 85, 36, 83, 100, 56, 82, 34, 66, 96, 28, 27, 79, 58, 20, 14, 62, 0, 36, 91, 5, 90, 84, 35, 31, 55, 76, 51, 1, 48, 10, 53, 8, 35, 68, 59, 32, 98, 76, 96, 9, 8, 40, 52, 68, 73, 43, 35, 30, 20, 12, 96, 11, 22, 25, 27, 92, 12, 64, 63, 33, 20, 24, 81, 7, 58, 5, 45, 31, 20, 63, 19, 23, 55, 45, 7, 58, 70, 14, 88, 23, 3, 89, 41, 63, 93, 87, 55, 47, 66, 5, 3, 18, 96, 65, 59, 42, 13, 53, 19, 7, 56, 49, 26, 20, 38, 51, 40, 9, 3, 85, 8, 3, 91, 84, 10, 64, 26, 8, 60, 83, 49, 26, 84, 15, 50, 99, 20, 100, 0, 81, 86, 100, 7, 29, 56, 48, 27, 25, 67, 0, 16, 27, 22, 21, 9, 38, 8, 10, 92, 91, 91, 42, 59, 37, 97, 23, 90, 27, 37, 89, 56, 90, 22, 76, 45, 56, 23, 32, 83, 39, 20, 11, 50, 65, 77, 99, 3, 92, 11, 33, 20, 70, 78, 75, 49, 25, 69, 81, 73, 77, 39, 18, 30, 18, 17, 70, 9, 69, 13, 42, 40, 9, 55, 84, 93, 16, 31, 90, 14, 49, 65, 31, 89, 35, 7, 52, 61, 17, 10, 82, 54, 81, 19, 45, 74, 76, 75, 88, 31, 16, 80, 60, 63, 73, 74, 7, 70, 23, 63, 24, 15, 34, 34, 15, 66, 57, 55, 24, 30, 69, 50, 82, 44, 1, 99, 10, 91, 66, 70, 61, 77, 11, 90, 98, 88, 24, 1, 46, 84, 39, 56, 67, 37, 83, 99, 39, 92, 97, 0, 84, 65, 49, 54, 42, 57, 57, 63, 78, 5, 86, 47, 99, 46, 41, 99, 68, 70, 89, 54, 50, 31, 95, 5, 98, 90, 52, 91, 76, 6, 27, 41, 27, 10, 31, 27, 99, 5, 65, 100, 76, 35, 10, 89, 6, 0, 8, 33, 72, 46, 79, 70, 59, 12, 99, 99, 15, 73, 66, 36, 57, 3, 24, 86, 75, 29, 5, 84, 4, 8, 100, 59, 63, 21, 71, 52, 5, 85, 61, 98, 4, 92, 73, 94, 70, 41, 17, 73, 18, 50, 56, 71, 60, 71, 25, 59, 78, 46, 31, 78, 65, 71, 59, 36, 56, 11, 36, 11, 96, 85, 60, 32, 91, 18, 37, 21, 79, 31, 72, 71, 20, 11, 16, 65, 87, 32, 34, 65, 15, 53, 39, 47, 13, 25, 40, 24, 94];
    let a = input.slice();
    let j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(random(randomNumbers[i]) * (i + 1)); // replaced Math.random() with a seeded random
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

function random(seed) {
    let x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

function permute(allBlockLevels) {
    let combinations = cartesian(allBlockLevels);
    let usedChars = [];
    let permArr = [];
    return helper(combinations);

    function helper(input) {
        let i, ch;
        for (i = 0; i < input.length; i++) {
            ch = input.splice(i, 1)[0];
            usedChars.push(ch);
            if (input.length === 0) {
                permArr.push(usedChars.slice());
            }
            helper(input);
            input.splice(i, 0, ch);
            usedChars.pop();
        }
        return permArr
    }
}

function lcm(input_array) {
    if (toString.call(input_array) !== "[object Array]")
        return false;
    let r1 = 0, r2 = 0;
    let l = input_array.length;
    for (let i = 0; i < l; i++) {
        r1 = input_array[i] % input_array[i + 1];
        if (r1 === 0) {
            input_array[i + 1] = (input_array[i] * input_array[i + 1]) / input_array[i + 1];
        }
        else {
            r2 = input_array[i + 1] % r1;
            if (r2 === 0) {
                input_array[i + 1] = (input_array[i] * input_array[i + 1]) / r1;
            }
            else {
                input_array[i + 1] = (input_array[i] * input_array[i + 1]) / r2;
            }
        }
    }
    return input_array[l - 1];
}

function arraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length)
        return false;
    for (let i = arr1.length; i--;) {
        if (arr1[i] !== arr2[i])
            return false;
    }
    return true;
}

function noTwoConsecutiveTrials(ret) {
    for (let participantIdx = 0; participantIdx < ret.length; participantIdx++) {
        let trialsPerParticipant = ret[participantIdx];
        for (let trialIdx = 0; trialIdx < (trialsPerParticipant.length - 1); trialIdx++) {
            if (arraysEqual(trialsPerParticipant[trialIdx], trialsPerParticipant[trialIdx + 1])) {
                return (trialIdx + 1);
            }
        }
    }
    return true;
}


  // module packaging: footer
  return {
    designToTrialTable: designToTrialTable,
    CB_FIXED: CB_FIXED,
    CB_LATIN: CB_LATIN,
    CB_RANDOM: CB_RANDOM,
    CB_COMPLETE: CB_COMPLETE,
    latinSquareGenerator: latinSquareGenerator,
    allRandomGenerator: allRandomGenerator,
    completeGenerator: completeGenerator,
    fixedOrderGenerator: fixedOrderGenerator,
    cartesian: cartesian
  }
}));
