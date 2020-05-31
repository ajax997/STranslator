var app = angular.module('stranslator', ['ui.bootstrap', 'ngMaterial', 'ngMessages', 'ngSanitize']);
app.config(function ($interpolateProvider) {
    $interpolateProvider.startSymbol('[[').endSymbol(']]');
});
app.controller('autoPopulateData', ['$scope', '$http', '$location', '$mdDialog', '$window', function ($scope, $http, $location, $mdDialog, $window) {

    function userLogin(newScope, ev) {

        $mdDialog.show({
            controller: DialogController,
            templateUrl: 'login_form',
            scope: newScope,
            preserveScope: true,
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose: true
        });
    }

    function getWikiSummary(keyword, newScope, ev) {

        $http({
            method: 'GET',
            url: "https://en.wikipedia.org/api/rest_v1/page/summary/" + keyword,
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            dataType: "json"
        }).then(function successCallback(response) {
            console.log(response.data.extract_html);
            newScope.wiki_content = response.data.extract_html;
            newScope.dialog_header = response.data.title;
            newScope.wiki_img_url = response.data.thumbnail == undefined ? "" : response.data.thumbnail.source;
            newScope.wiki_content_href = response.data.content_urls.desktop.page;
            $mdDialog.show({
                    controller: DialogController,
                    templateUrl: 'modal',
                    scope: newScope,
                    parent: angular.element(document.body),
                    targetEvent: ev,
                    clickOutsideToClose: true
                })
                .then(function (answer) {

                }, function () {

                });

        }, function errorCallback(response) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
        });
    }

    function getInitialMeaning(input) {
        var r_text = "";
        var r_score = 0;
        for (var i = 0; i< input.jsondata.length; i++)
        {
            if (input.jsondata[i].freq > r_score)
            {
                r_text = input.jsondata[i].m;
                r_score = input.jsondata[i].freq;
            }
        }
        return r_text;
    }

    /*
    show wikipedia information about the search term
    */

    $scope.showAdvanced = function (ev) {
        var newScope = $scope.$new();
        getWikiSummary($scope.input_text, newScope, ev);

    };

    $scope.showLogin = function (ev) {
        $scope.login_action = "Login";
        $scope.login_method = "Sign Up"
        userLogin($scope, ev);
    };

    $scope.loginOrSignup = function () {
        if ($scope.login_action == "Login") {
            var req = {
                method: 'POST',
                url: '/login',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: {
                    'username': $scope.identity_username,
                    'password': $scope.identity_password,
                }
            }

            $http(req).then(function successCallback(response) {
                if (response.data != false) {
                    console.log(response.data);
                    $scope.is_user_login = true;
                    $scope.logged_username = response.data;
                    $mdDialog.cancel();
                }

            }, function () {

            });
        } else {
            var req = {
                method: 'POST',
                url: '/signup',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: {
                    'username': $scope.identity_username,
                    'password': $scope.identity_password,
                }
            }

            $http(req).then(function successCallback(response) {
                $scope.is_user_login = true;
                $scope.logged_username = response.data;
                $mdDialog.cancel();
            }, function () {

            });
        }

    };

    $scope.switchLoginMethod = function (ev) {
        if ($scope.login_action == 'Login') {
            $scope.login_action = "Sign Up";
            $scope.login_method = "Login";
        } else {
            $scope.login_action = "Login";
            $scope.login_method = "Sign Up";
        }
    }

    function DialogController($scope, $mdDialog) {
        $scope.hide = function () {
            $mdDialog.hide();
        };

        $scope.cancel = function () {
            $mdDialog.cancel();
        };

        $scope.answer = function (answer) {
            $mdDialog.hide(answer);
        };
    }
    // function sort_callback_result(arr)
    // {
    //     function compare(a, b){
    //         if (a.freq > b.freq)
    //         return 1;
    //         return -1;
    //     }
    //     return arr.sort(compare);
    // }

    function getResponse(input) {
        if (input == '') {

            var url = '/api/get?entry=' + input;
            $scope.prediction_text = '';
            $scope.translate_result = []
            $scope.pos_types = []
            $scope.eng_definitions = []
            $scope.g_tags = []
            $scope.show_waiting_mess = false;
            $scope.input_text = input;
            $scope.tag_selected = [];
            $scope.source_r_header = ''
            $scope.dest_r_header = ''
            $scope.dest_notes = []
            $scope.source_notes = []
        } else {

            var url = '/api/get?entry=' + input;
            console.log(url);
            if (input == '') {
                $scope.translate_result = false;
                return;

            }
            $scope.show_waiting_mess = true;
            $http({
                method: 'GET',
                url: url,
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                },
                dataType: "json"
            }).then(function successCallback(response) {
                console.log(response.data);
                $scope.prediction_text = response.data.prediction;
                if (response.data.prediction == "") {
                    $scope.translate_result = response.data.m_vn.jsondata;
                    $scope.pos_types = response.data.m_vn.meta.pos;
                    $scope.eng_definitions = response.data.m_eng
                    $scope.g_tags = response.data.m_vn.meta.global_tags;
                    $scope.show_waiting_mess = false;
                    $scope.input_text = input;
                    $scope.tag_selected = [];
                    $scope.source_r_header = response.data.m_eng.meta.r_header;
                    $scope.dest_r_header = response.data.m_vn.meta.r_header;
                    $scope.dest_notes = response.data.m_vn.meta.notes;
                    $scope.source_notes = response.data.m_eng.meta.notes;
                    $scope.translatedResult = getInitialMeaning(response.data.m_vn);
                }

            }, function errorCallback(response) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
            });
        }
    }

    function checkLoginCredential() {
        //TO BE UPDATE COOKIE AND SESSION
        $http({
            method: 'GET',
            url: "/session/get",
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            dataType: "json"
        }).then(function successCallback(response) {

            if (response.data != 'false') {
                $scope.is_user_login = true;
                $scope.logged_username = response.data;
            } else {
                $scope.is_user_login = false;
            }
        });

    }

    $scope.user_logout = function () {
        $http({
            method: 'GET',
            url: "/logout",
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            dataType: "json"
        }).then(function successCallback(response) {
            $window.location.reload();
        });
    }

    $scope.determine_best_match = function (latest_tag_clicked) {

        var ms = $scope.translate_result;

        for (var i = 0; i < ms.length; i++) {
            var ts = ms[i].tags;
            for (var j = 0; j < ts.length; j++) {
                if (ts[j] == latest_tag_clicked) {
                    $scope.translatedResult = ms[i].m;
                }
            }
        }
    }

    $scope.init = function () {

        checkLoginCredential();

        if ($location.search().data != undefined)
            $location.url($location.path() + "?data=" + $location.search().data);
        else {
            $scope.prediction_text = '';
            $scope.translate_result = []
            $scope.pos_types = []
            $scope.eng_definitions = []
            $scope.g_tags = []
            $scope.show_waiting_mess = false;
            $scope.input_text = "";
            $scope.tag_selected = [];
            $scope.source_r_header = ''
            $scope.dest_r_header = ''
            $scope.dest_notes = []
            $scope.source_notes = []
        }

    }
    $scope.inputChange = function (input) {
        $location.url($location.path() + "?data=" + input);


    };

    $scope.listSlelectedTag = [];

    $scope.selectTag = function (input, value) {
        var index = $scope.tag_selected.indexOf(input);
        if (index > -1) {
            $scope.tag_selected.splice(index, 1);
            console.log($scope.tag_selected);
        } else {
            $scope.tag_selected.push(input);
        }

        var index_v = $scope.listSlelectedTag.indexOf(value);
        if (index_v > -1) {
            $scope.listSlelectedTag.splice(index_v, 1);
        } else {
            $scope.listSlelectedTag.push(value);
        }
        console.log($scope.listSlelectedTag)
        $scope.determine_best_match(value);
    }

    $scope.translate_w = function (input) {
        $location.url($location.path() + "?data=" + input);
        //getResponse(input);
    };

    $scope.show_example_sentences = function(node_id, m){
        $http({
            method: 'POST',
            url: "/api/get_example",
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            dataType: "json",
            data: {
                from_node: $scope.dest_r_header,
                to_node_id: node_id
            }

        }).then(function successCallback(response) {
            $scope.example_sentences = response.data;
            $scope.examples_header_title = m;
            $mdDialog.show({
                controller: DialogController,
                templateUrl: 'example_sentences',
                scope: $scope,
                preserveScope: true,
                parent: angular.element(document.body),
                clickOutsideToClose: true
            });
        });
        
    }

    $scope.$on('$locationChangeStart', function () {
        if ($location.search().data != undefined) {
            $scope.input_text = $location.search().data;
            getResponse($location.search().data);
        }
    });

}]);