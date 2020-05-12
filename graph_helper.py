
from graphdb import nGraph
from autocorrect import Speller
import json
import re

g = nGraph("bolt://localhost:7687", "ajax997", "lumia1020")

def no_accent_vietnamese(input_str):
    s1 = u'ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝàáâãèéêìíòóôõùúýĂăĐđĨĩŨũƠơƯưẠạẢảẤấẦầẨẩẪẫẬậẮắẰằẲẳẴẵẶặẸẹẺẻẼẽẾếỀềỂểỄễỆệỈỉỊịỌọỎỏỐốỒồỔổỖỗỘộỚớỜờỞởỠỡỢợỤụỦủỨứỪừỬửỮữỰựỲỳỴỵỶỷỸỹ'
    s0 = u'AAAAEEEIIOOOOUUYaaaaeeeiioooouuyAaDdIiUuOoUuAaAaAaAaAaAaAaAaAaAaAaAaEeEeEeEeEeEeEeEeIiIiOoOoOoOoOoOoOoOoOoOoOoOoUuUuUuUuUuUuUuYyYyYyYy'
    s = ''
    for c in input_str:
        if c in s1:
            s += s0[s1.index(c)]
        else:
            s += c
    return s

def __merge(vn_res1, vn_res2):
    meta_pos = [x for x in set(vn_res1['meta']['pos']) | set(vn_res2['meta']['pos'])]
    meta_tags = [x for x in set(vn_res1['meta']['global_tags']) | set(vn_res2['meta']['global_tags'])]
    meta_note = [x for x in set(vn_res1['meta']['notes'])|set(vn_res2['meta']['notes'])]
    meta_r_header = vn_res2['meta']['r_header']
    # g_tags = [x for x in set(vn_res1['g_tags']) | set(vn_res2['g_tags'])]
    jsondata = vn_res1['jsondata'] + vn_res2['jsondata']
    meta = {'pos': meta_pos, 'global_tags': meta_tags, 'notes': meta_note, 'r_header': meta_r_header}
    return {'meta': meta, 'jsondata': jsondata}
def __add_note(source, note):
    meta_note = [x for x in set(source['meta']['notes'])|set(note)]
    source['meta']['notes'] = meta_note
    return source

def process_isolated_node(w, labels):
    try:
        labels.remove("ObjectEntity")
        labels.remove("ROOTNODE")

    except:
        pass
    direct_node = g.get_direct_meaning_node(w, "LANG_POS_MEANING")
    print(direct_node)
    local_m = get_vn_meaning(w)
    eng_m = get_eng_meaning(direct_node)
    derivetive_m = get_vn_meaning(direct_node)
    return {'prediction': "", 'm_eng': eng_m, 'm_vn': __add_note(__merge(local_m, derivetive_m), labels)}
    
     
def process_not_found_node(w):
    w = no_accent_vietnamese(w)
    spell = Speller(lang='en')
    predicted = spell(w)
    return {'prediction': '' if predicted == w else predicted, 'm_eng': {}, 'm_vn': {}}

def get_vn_meaning(v_w, pos = ''):
    return_content = {}
    arr_r = []
    meta = {}
    r = g.get_meaning_of_word(v_w, pos)
    results = r[1].records()
    print(r[0])
    pos_avai = set()
    tag_avai = set()
    for x in results:
        relationship, node = x['r'], x['v']
        s = {}
        s_pos = []
        exp_html = ''
        for x in node.labels:
            s_pos.append(x)
            if x != 'ObjectEntity':
                pos_avai.add(x)
        if "inline_expl" in node:
            for x in node['inline_expl']:
                exp_html+='; '+x
            s['inline_expl'] = exp_html[2:] if exp_html != '' else ''
        
        if 'tags' in node:
            for x in node['tags']:
                exp_html+='; '+x
            for t in node['tags']:
                tag_avai.add(t)
        s['pos'] = s_pos
        s['m'] = node['objectEntity']
        s['freq'] = relationship['freq']
        s['tags'] = node['tags']
        if 'EXPLANATION' not in s_pos:
            n_with_same_m = g.run_raw_query("match (n:"+':'.join(x for x in s_pos)+"{objectEntity:\""+s['m']+"\"})<-[:TRANS_EN_VI]-(v) return v.objectEntity as r")[1]
            same_m = set()
            for no in n_with_same_m.records():
                same_m.add(no['r'])
            
            s['n_same_m'] = [x for x in same_m]
        else:
            s['n_same_m'] = []

        

        arr_r.append(s)
    meta['notes'] = []
    meta['r_header'] = v_w
    meta['pos'] = [x for x in pos_avai]
    meta['global_tags'] = [x for x in tag_avai]
    return_content['meta'] = meta
    # return_content['g_tags'] = [x for x in tag_avai]
    return_content['jsondata'] = arr_r 
    return return_content

def get_eng_meaning(e_w):
    return_arr = []
    pos_avai = set()
    r = g.get_meaning_itself(e_w)
    meta = {}
    results = r[1].records()
    for x in results:
        label, defi, n_id = x['lbs'], x['def'], x['id']
        arr_m = {}
        for l in label:
            if l != "ObjectEntity":
                arr_m['pos'] = l
                pos_avai.add(l)

        arr_m['definition'] = defi
        synonynms = g.get_en_synonynm(n_id)[1].records()
        sn = []
        for sy in synonynms:
            sn.append(sy['s'])
        
        arr_m['synonynm'] = sn 
        return_arr.append(arr_m)
        meta['notes'] = []
        meta['pos'] = [x for x in pos_avai]
        meta['r_header'] = e_w
    return {'meta': meta , 'jsondata':return_arr}

def check_user_exist(username):
    if g.check_user_name(username):
        return True
    return False
    
def check_login(username, password):
    if g.check_login_credential(username, password):
        return True
    else:
        return False
def register_user(username, password, email):
    return g.create_user(username, password, email)