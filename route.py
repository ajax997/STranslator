from flask import Flask, request, send_from_directory, render_template
from graphdb import nGraph
import json
import graph_helper as ghelper

app = Flask(__name__)

g = nGraph("bolt://localhost:7687", "ajax997", "lumia1020")

# @app.route("/js/<path:path>")
# def return_js(path):
#     return send_from_directory("js", "main.js")

# @app.route("/styles/<path:path>")
# def return_css(path):
#     # return path
#     return send_from_directory('styles', path)

@app.route("/")
def hello():
    return render_template("mainpage.html")
    
@app.route("/modal")
def render_modal():
    return render_template("modal.html")

@app.route("/api/get", methods=['get'])
def meaning():
    entry = request.args.get('entry').strip().lower()
    #return json.dumps(get_meaning_json(entry))
    return json.dumps(get_meaning_json(entry))

# @app.route('/test')
# def test():
#     return json.dumps(get_meaning_json("killing"))


def get_meaning_json(w):
    # check if the node is exitsts
    labels = g.get_label(w)
    
    if g.check_node_exist(w):
        # check if the node has no direct meaning e.g. globally (get meaning via) -> global 
        if not g.check_no_direct_vn_meaning(w) and len(labels) == 2:
            m_eng = ghelper.get_eng_meaning(w)
            m_vn = ghelper.get_vn_meaning(w)
            return {'prediction':'','m_eng': m_eng, 'm_vn': m_vn}
        else:
            return ghelper.process_isolated_node(w, labels)
    else:
        # process if the node is not found, check the typo and suggesting closest possible word.
        return ghelper.process_not_found_node(w)

if __name__ == "__main__":
    app.config['TEMPLATES_AUTO_RELOAD']=True
    app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=True) 