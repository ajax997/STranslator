from flask import Flask, request, send_from_directory, render_template
from graphdb import nGraph
import json
import graph_helper as ghelper
from flask import request
import os
import hashlib
from flask import Flask, session

app = Flask(__name__)

g = nGraph("bolt://localhost:7687", "ajax997", "lumia1020")

SALT = "ARTSENSYS_AJAX99&"


def hash_password(password):
    return hashlib.sha224((password+SALT).encode()).hexdigest()


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
    return render_template("login_form.html")


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

@app.route('/session/get', methods=['get'])
def get():
    if (session.get("current_login_user")):
        return session.get('current_login_user')
    return "false"

@app.route("/signup", methods=['POST'])
def signup_user():
    data = request.get_json()
    ghelper.register_user(
        data['username'], hash_password(data['password']), "")
    return data['username']


@app.route("/api/get", methods=['get'])
def meaning():
    entry = request.args.get('entry').strip().lower()
    # return json.dumps(get_meaning_json(entry))
    return json.dumps(get_meaning_json(entry))

# @app.route('/test')
# def test():
#     return json.dumps(get_meaning_json("killing"))


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


if __name__ == "__main__":
    app.secret_key = 'super secret key'
    app.config['SESSION_TYPE'] = 'filesystem'
    app.config['TEMPLATES_AUTO_RELOAD'] = True
    app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=True)
    
