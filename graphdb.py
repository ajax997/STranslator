from neo4j import GraphDatabase

class nGraph():
    def __init__(self, uri, user, password):
        self._driver = GraphDatabase.driver(uri, auth=(user, password))
    def close(self):
        self._driver.close()
    

    def __run_statement(self, query):
        with self._driver.session() as session:
            return session.write_transaction(self.run, query)

    def run_raw_query(self, query):
        return self.__run_statement(query)

    def get_label(self, entity):
        query = "MATCH (n:ObjectEntity{objectEntity:'"+entity+"'}) RETURN labels(n) as lb"
        r = self.__run_statement(query)[1].records()
        for n in r:
            return n['lb']

    def check_node_exist(self, node_entity):
        cypher_s = "MATCH (n:ObjectEntity{objectEntity:'"+node_entity+"'}) RETURN count(n) <> 0 as res"
        r = self.__run_statement(cypher_s)[1].records()
        for n in r:
            return n['res']
    
    def get_direct_meaning_node(self, entity, r_type):
        query = "MATCH(n:ObjectEntity{objectEntity:'"+entity+"'})-[r:"+r_type+"]-(v:ROOTNODE) return v.objectEntity as root"
        r = self.__run_statement(query)[1].records()
        for n in r:
            return n['root']

    

    def check_no_direct_vn_meaning(self, node_entity):
        cypher_s = "match(n:ObjectEntity{objectEntity:'"+node_entity+"'})-[r:TRANS_EN_VI]-() return count(r) = 0 as res"
        r = self.__run_statement(cypher_s)[1].records()
        for n in r:
            return n['res']

    def get_meaning_of_word(self, w, pos):
        query = "match (n:ObjectEntity{objectEntity:'"+w+"'})-[r:TRANS_EN_VI|:EXPLAINAION_VI_VI]->(v"+pos+")  return n,r,v"
        return self.__run_statement(query)
    def get_meaning_itself(self, w):
        query = "match (n:ObjectEntity{objectEntity:'"+w+"'})-[:LANG_POLY_MEANING]->(v) where exists(v.definition)  return labels(v) as lbs, v.definition as def ,ID(v) as id"
        return self.__run_statement(query)
    def get_en_synonynm(self, _id):
        query = 'match (n)-[:LANG_RELATED_SYNONYM]->(v) where id(n)='+str(_id) + " return v.objectEntity as s"
        return self.__run_statement(query)

    def __getitem__(self, key):
        cypher_s = "MATCH (n {name: '"+key+"'}) return n" 
        return self.__run_statement(cypher_s)
    
    @staticmethod
    def run(tx, message):
        result = tx.run(message)
        avail = result.summary().result_available_after
        cons = result.summary().result_consumed_after
        total_time = avail + cons
        return str(total_time)+" ms", result