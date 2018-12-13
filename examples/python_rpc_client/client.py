import zerorpc

c = zerorpc.Client()
c.connect("tcp://127.0.0.1:4242")

# generate trial table from TSL input
print((c.generate_tsl("< Latin(Device = {M, T, J}, 5)>", 4)))


# generate the same trial table from abstract syntax tree input 
# (as a Python object)

design_ast = [{
    "name": None,
    "repetition": 1,
    "design": {
        "strategy": 'latin',
        "serial": False,
        "variables": [{
            "name": 'Device',
            "levels": ['M', 'T', 'J']}],
        "replication": 5}}]

print((c.generate_ast(design_ast, 4)))
