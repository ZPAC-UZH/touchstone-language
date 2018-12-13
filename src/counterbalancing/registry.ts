import {TSLTrialTable, TSLBlock, TSLGeneratorFunction} from "../tsl_types";

export class TSLStrategyRegistry {
    private static singleton: TSLStrategyRegistry;
    private generators : object;

    private constructor() {
        // private constructor so that no instance is created
        this.generators = {};
    }

    public static sharedRegistry(): TSLStrategyRegistry {
        if (!TSLStrategyRegistry.singleton) {
            TSLStrategyRegistry.singleton = new TSLStrategyRegistry();
        }
        return TSLStrategyRegistry.singleton;
    }

    public addGeneratorForStrategy(name: string, func: TSLGeneratorFunction): void {
        this.generators[name] = func;
    }

    public generatorForStrategy(name: string): TSLGeneratorFunction {
        if (!this.generators.hasOwnProperty(name)) {
            throw new Error(`No generator registered for ${name}.`);
        }
        return this.generators[name];
    }
}
