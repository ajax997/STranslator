from neo4j import GraphDatabase

class nGraph():
    def __init__(self, uri, user, password):
        self._driver = GraphDatabase.driver(uri, auth=(user, password))
    def close(self):
        self._driver.close()
    

    def __run_statement(self, query):
        with self._driver.session() as session:
            return session.write_transaction(self.run, query)

    ####################### DB Stuff #########################

    def run_raw_query(self, query):
        return self.__run_statement(query)

    def get_label(self, entity):
        query = "MATCH (n:ObjectEntity{objectEntity:\""+entity+"\"}) RETURN labels(n) as lb"
        r = self.__run_statement(query)[1].records()
        for n in r:
            return n['lb']
    
    def get_label_by_id(self, node_id):
        query = "MATCH (n) where id(n) = {} RETURN labels(n) as lb".format(node_id)
        r = self.__run_statement(query)[1].records()
        for n in r:
            return n['lb']

    def check_node_exist(self, node_entity):
        cypher_s = "MATCH (n:ObjectEntity{objectEntity:\""+node_entity+"\"}) RETURN count(n) <> 0 as res"
        r = self.__run_statement(cypher_s)[1].records()
        for n in r:
            return n['res']
    
    def get_direct_meaning_node(self, entity, r_type):
        query = "MATCH(n:ObjectEntity{objectEntity:\""+entity+"\"})-[r:"+r_type+"]->(v:ROOTNODE) return v.objectEntity as root"
        r = self.__run_statement(query)[1].records()
        for n in r:
            return n['root']
        return entity

    def delete_en_vi_connection(self, id_from, id_to):
        query = "MATCH (n)-[r:TRANS_EN_VI]->(v) where id(n) = {} and id(v) = {} delete r".format(id_from, id_to)
        self.__run_statement(query)

    def search_english_node(self, entity):
        query = "match (n:ObjectEntity:ROOTNODE) where n.objectEntity starts with '{}' return distinct n as res order by length(n.objectEntity) limit 30 ".format(entity)
        r = self.__run_statement(query)[1].records()
        results = []
        for n in r:
            results.append({'keyword': n['res']['objectEntity'], "node_id": n['res'].id})
        return results
    
    def create_english_root_node(self, entity):
        query = "create (n:ROOTNODE:ObjectEntity{{ objectEntity:\"{}\", length: {}, language: \"english\", word : {}  }})".format(entity, len(entity), "false" if " " in entity else "true")
        self.__run_statement(query)

    def check_no_direct_vn_meaning(self, node_entity):
        cypher_s = "match(n:ObjectEntity{objectEntity:\""+node_entity+"\"})-[r:TRANS_EN_VI]-() return count(r) = 0 as res"
        r = self.__run_statement(cypher_s)[1].records()
        for n in r:
            return n['res']

    def update_meaning(self, data):
        edited_node_id = data['node_id']
        edited_pos = data['edited_pos']
        edited_m = data['edited_m']
        edited_tags = data['edited_tags']
        edited_inline = data['edited_inline']
        lable_list = ":".join(x for x in self.get_label_by_id(edited_node_id))

        query = "match (n) where id(n) = {} remove n:{} set n.objectEntity = \"{}\", n.tags = {}, n.inline_expl = [\"{}\"], n:{}" \
            .format(edited_node_id, lable_list ,edited_m, str(edited_tags), edited_inline, ":".
            join(x for x in edited_pos)).replace("[\"\"]", "[]").replace("['']", "[]")
        print("EDIT QUERY: ", query)
        return self.__run_statement(query)
    
    def update_relationship_freq(self, from_node, to_node_id, freq, examples):
        query = "match (n:ROOTNODE:ObjectEntity{{ objectEntity: \"{}\" }})-[r:TRANS_EN_VI]-(v) where id(v) = {} set r.freq = {} , r.translation_examples = {}".format(from_node, to_node_id, freq, examples)
        #print(query)
        return self.__run_statement(query)

    def get_meaning_of_word(self, w, pos):
        query = "match (n:ObjectEntity{objectEntity:\""+w+"\"})-[r:TRANS_EN_VI|:EXPLAINAION_VI_VI]->(v"+pos+")  return n,r,v order by r.freq desc"
        return self.__run_statement(query)
    def get_meaning_itself(self, w):
        query = "match (n:ObjectEntity{objectEntity:\""+w+"\"})-[:LANG_POLY_MEANING]->(v) where exists(v.definition)  return labels(v) as lbs, v.definition as def ,ID(v) as id"
        return self.__run_statement(query)
    def get_en_synonynm(self, _id):
        query = 'match (n)-[:LANG_RELATED_SYNONYM]->(v) where id(n)='+str(_id) + " return v.objectEntity as s"
        return self.__run_statement(query)

    def check_vn_meaning_exist(self, pos,m):
        query = "match (n:ObjectEntity:{}) where n.objectEntity = \"{}\" and n.tags = [] and n.inline_expl = [] and n.language = \"vietnamese\" return id(n) as id".format(pos, m)
        r = self.__run_statement(query)[1].records()
        for n in r:
            return n['id']
        return False

    def insert_en_vn_meaning(self, from_id, details):
        new_pos     = details['pos']
        new_m       = details['m']
        new_tags    = details['tags']
        new_inline  = details['inline']
        check_result = self.check_vn_meaning_exist(new_pos, new_m)
        print(check_result)
        print(new_tags, new_inline.strip() == "")
        if (check_result != False and new_tags[0] == "" and new_inline == ""):
            query = "match(n) match(v) where id(n) = {} and id(v) = {} create(n)-[:TRANS_EN_VI{{freq: 1}}]->(v)".format(from_id, check_result)
            print(query)
            return self.__run_statement(query)
        else:
            query = "match (n) where id(n) = {} merge(v:ObjectEntity:{}{{ objectEntity:\"{}\", language: \"vietnamese\", tags: {}, inline_expl: [\"{}\"] }}) create(n)-[r:TRANS_EN_VI{{freq: 1}}]->(v)"\
                .format(from_id, new_pos, new_m,str(new_tags), new_inline).replace("[\"\"]", "[]").replace("['']", "[]")
            print(query)
            return self.__run_statement(query)




    #########################USER STUFFS############################

    def check_user_name(self, username):
        cypher_s = "match(n:User{username:\""+username+"\"}) return count(n) <> 0 as res"
        r = self.__run_statement(cypher_s)[1].records()
        for n in r:
            return n['res']
    
    def create_user(self, username, password, email, admin=0):
        cypher_s = "create (n:User{username:\""+username+"\", password: \""+password+"\", email: \""+email+"\", admin: "+str(admin)+"}) return n.id as res"
        r = self.__run_statement(cypher_s)[1].records()
        for n in r:
            return n['res']
    
    def check_login_credential(self, username, password, admin):
        cypher_s = "match(n:User{username:\""+username+"\", password: \""+password+"\", admin: "+str(admin)+"}) return count(n) <> 0 as res"
        r = self.__run_statement(cypher_s)[1].records()
        for n in r:
            return n['res']

    def get_en_vi_relation_attr(self, from_node, to_node_id, attr):
        query = "match (n:ROOTNODE:ObjectEntity{{ objectEntity: \"{}\" }})-[r:TRANS_EN_VI]->(v) where id(v) = {} return r.{} as res".format(from_node, to_node_id, attr)
        r = self.__run_statement(query)[1].records()
        for n in r:
            return n['res']

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