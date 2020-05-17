from flask import Flask, request, send_from_directory, render_template
from graphdb import nGraph
import json
# import graph_helper as ghelper
from graph_helper import GraphHelper
from flask import request
import os
import hashlib
from flask import Flask, session
import configparser

app = Flask(__name__)


config = configparser.ConfigParser()

config.read('config.ini')
#g = nGraph("bolt://47.56.159.249:7687", "ajax997", "lumia1020")
g = nGraph(config['DATABASE']['database_bolt_url'], config['DATABASE']['database_admin_username'], config['DATABASE']['database_admin_pass'])
SALT = config['DATABASE']['salt']

ghelper = GraphHelper(g)

def hash_password(password):
    return hashlib.sha224((password+SALT).encode()).hexdigest()

######################### MAIN FUNCTIONALITIES ########################

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'), 'images/logo.png')


@app.route("/")
def hello():
    return render_template("mainpage.html")



@app.route("/modal")
def render_modal():
    return render_template("modal.html")


@app.route("/login_form")
def render_modal_login():
    return render_template("user_login_form.html")

@app.route("/edit_meaning")
def render_edit_meaning_form():
    return render_template("edit_meaning_modal.html")

@app.route("/manage/api/update", methods = ['PATCH'])
def update_meaning():
    data = request.get_json()['tobe_sent_data']
    g.update_meaning(data)
    return "ok"

@app.route("/login", methods=['POST'])
def user_login():
    data = request.get_json()
    if ghelper.check_login(data['username'], hash_password(data['password'])):
        session['current_login_user'] = data['username']
        return data['username']
    else:
        return json.dumps(False)

@app.route('/logout')
def logout():
    session.pop('current_login_user', None)
    return render_template("mainpage.html")



@app.route("/signup", methods=['POST'])
def signup_user():
    data = request.get_json()
    ghelper.register_user(data['username'], hash_password(data['password']), "")
    session['current_login_user'] = data['username']
    return data['username']


@app.route("/api/get", methods=['get'])
def meaning():
    entry = request.args.get('entry').strip().lower()
    # return json.dumps(get_meaning_json(entry))
    return json.dumps(get_meaning_json(entry))

@app.route("/api/search", methods=['get'])
def get_list_search():
    entry = request.args.get('entry').strip().lower()
    return json.dumps(g.search_english_node(entry))


def get_meaning_json(w):
    # check if the node is exitsts
    labels = g.get_label(w)

    if g.check_node_exist(w):
        # check if the node has no direct meaning e.g. globally (get meaning via) -> global
        if not g.check_no_direct_vn_meaning(w) and (len(labels) == 2 or "Phrasal_Verb" in labels or "IDIOM" in labels):
            m_eng = ghelper.get_eng_meaning(w)
            m_vn = ghelper.get_vn_meaning(w)
            return {'prediction': '', 'm_eng': m_eng, 'm_vn': m_vn}
        else:
            return ghelper.process_isolated_node(w, labels)
    else:
        # process if the node is not found, check the typo and suggesting closest possible word.
        return ghelper.process_not_found_node(w)

########################## ADMIN FUNCTIONALITIES ############################

@app.route('/session/get', methods=['get'])
def get():
    if (session.get("current_login_user")):
        return session.get('current_login_user')
    return "false"

@app.route("/manage/admin")
def access_admin_page():
    return render_template("admin_landing_page.html")

@app.route("/manage/admin_login")
def render_modal_admin_login():
    return render_template("admin_login_form.html")

@app.route("/manage/login", methods=['post'])
def admin_login():
    data = request.get_json()
    if ghelper.check_login(data['username'], hash_password(data['password']), 1):
        session['current_login_user'] = data['username']
        return data['username']
    else:
        return json.dumps(False)

@app.route("/manage/delete_relation", methods=['DELETE'])
def delete_relation_en_vn():
    data = request.get_json()
    f = data['from_node_id']
    t = data['to_node_id']
    g.delete_en_vi_connection(f, t)
    return "ok"

@app.route("/manage/add_meaning", methods = ["POST"])
def add_en_vn_meaning_for_word():
    data = request.get_json()
    root_node = data['from_node_id']
    new_m_details = data['new_node_details']
    g.insert_en_vn_meaning(root_node, new_m_details)
    return "ok"

######################### Application Configuration ##########################


if __name__ == "__main__":
    app.secret_key = 'super secret key'
    app.config['SESSION_TYPE'] = 'filesystem'
    app.config['TEMPLATES_AUTO_RELOAD'] = True
    app.run(host='0.0.0.0', port=80, debug=True, use_reloader=True)
    
