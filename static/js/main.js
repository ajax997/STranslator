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

    function load_bookmark() {
        if ($scope.bookmarked_stuffs.sortedby == undefined && $scope.bookmarked_stuffs.current_page != undefined) {
            $scope.bookmarked_stuffs.sortedby = "date";
        }
        var req = {
            method: 'GET',
            url: '/api/getsaveditem?sortedby=' + $scope.bookmarked_stuffs.sortedby + "&page=" + $scope.bookmarked_stuffs.current_page,
        }

        $http(req).then(function successCallback(response) {
            $scope.bookmarked_stuffs.current_bookmark_items = response.data;
        }, function () {
            
        });
    }

    $scope.$watch("bookmarked_stuffs.current_page", function () {
        console.log("watch init")
        if ($scope.bookmarked_stuffs.sortedby != undefined)
            load_bookmark();
    });
    $scope.increaseBookmarkPage = function()
    {
        if ($scope.bookmarked_stuffs.current_page + 1 < $scope.bookmarked_stuffs.number_of_page )
        {
            $scope.bookmarked_stuffs.current_page += 1 
        }
    }
    $scope.decreaseBookmarkPage = function()
    {
        if ($scope.bookmarked_stuffs.current_page - 1 >= 0 )
        {
            $scope.bookmarked_stuffs.current_page -= 1 
        }
    }

    $scope.showSavedItems = function (ev) {
        console.log("init")
        if ($scope.bookmarked_stuffs.cached == undefined) {
            var req = {
                method: 'GET',
                url: '/api/getnumbersaveditem',
            }

            $http(req).then(function successCallback(response) {
                $scope.bookmarked_stuffs.number_of_bookmark = response.data;
                $scope.bookmarked_stuffs.number_of_page = response.data / 10;
                if ($scope.bookmarked_stuffs.number_of_page > 0) {
                    $scope.bookmarked_stuffs.sortedby = "date";
                    $scope.bookmarked_stuffs.current_page = 0;

                    // load_bookmark(0)
                }
            }, function () {
                
            });
        }
        $mdDialog.show({
            controller: DialogController,
            templateUrl: 'bookmarks',
            scope: $scope,
            preserveScope: true,
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose: true
        });
    }

    $scope.practicePopulate = function(ev){
        $mdDialog.cancel();
        console.log("efef");
        $mdDialog.show({
            controller: DialogController,
            templateUrl: 'practice',
            scope: $scope,
            preserveScope: true,
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose: true
        });
    }

    function getInitialMeaning(input) {
        var r_text = "";
        var r_score = 0;
        for (var i = 0; i < input.jsondata.length; i++) {
            if (input.jsondata[i].freq > r_score) {
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
        $scope.dialog_header = "";
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
                if (response.data != false && response.data != "false") {
                    console.log(response.data);
                    $scope.is_user_login = true;
                    $scope.logged_username = response.data;
                    $mdDialog.cancel();
                    $window.location.reload();
                } else {
                    $scope.dialog_header = "Incorrect Username or Password!"
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
            $scope.translation_saved = false;
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
                    isSavedTranslation();
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
            console.log(typeof (response.data));
            if (response.data != "false" && response.data != false) {
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
            $scope.is_user_login = false;
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
        $scope.bookmarked_stuffs = {};
        $scope.test_stuffs = {};
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

    $scope.autoExpand = function (event) {

        var target = document.getElementById("translated_result_id");


        target.style.height = document.getElementById("main-input").style.height;

    }

    $scope.$watch("show_waiting_mess", function () {

        var target = document.getElementById("translated_result_id");
        if ($scope.show_waiting_mess == true) {
            $scope.translatedResult = "";
            target.style.height = document.getElementById("main-input").style.height - 25;
        } else {

            target.style.height = document.getElementById("main-input").style.height;
        }

    });

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

    function getCurrentDateTime() {
        var today = new Date();
        var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
        var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
        var dateTime = date + ' ' + time;
        return dateTime;
    }

    $scope.show_example_sentences = function (node_id, m) {
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

    $scope.save_translation = function () {
        if ($scope.is_user_login != true) {
            $scope.showLogin(null);
        } else {
            $http({
                method: 'POST',
                url: "/api/bookmark",
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                },
                dataType: "json",
                data: {
                    saving_obj: {
                        owner: $scope.logged_username,
                        src_lang: "english",
                        dest_lang: "vietnamese",
                        src_text: $scope.input_text,
                        dest_text: $scope.translatedResult,
                        created: getCurrentDateTime()
                    }
                }
            }).then(function successCallback(response) {
                $scope.translation_saved = true;
            });

        }
    }


    function isSavedTranslation() {
        if ($scope.is_user_login == true) {
            $http({
                method: 'POST',
                url: "/api/checksavedtranslation",
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                },
                dataType: "json",
                data: {
                    saving_obj: {
                        owner: $scope.logged_username,
                        src_lang: "english",
                        dest_lang: "vietnamese",
                        src_text: $scope.input_text,
                        dest_text: $scope.translatedResult
                    }
                }
            }).then(function successCallback(response) {
                if (response.data == 'true') {
                    $scope.translation_saved = true;
                } else {
                    $scope.translation_saved = false;
                }
            });
        }
    }



    $scope.unsave_translation = function () {
        $http({
            method: 'POST',
            url: "/api/unbookmark",
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            dataType: "json",
            data: {
                saving_obj: {
                    owner: $scope.logged_username,
                    src_lang: "english",
                    dest_lang: "vietnamese",
                    src_text: $scope.input_text,
                    dest_text: $scope.translatedResult
                }
            }
        }).then(function successCallback(response) {
            $scope.translation_saved = false;
        });
    }

    $scope.editPageForAdmin = function()
    {
        window.open("/manage/admin#!?data="+$scope.input_text, "_blank");
    }
//################################test/////////////////////////////

    $scope.$watch("test_stuffs.current_question_number", function(){
        console.log("test_current"+$scope.test_stuffs.current_question);
        if ($scope.test_stuffs.current_question_number != undefined)
        {
            generateQuestion($scope.test_stuffs.current_question_number);
        }
    });

    function generateQuestion(quest_index){
        var word = $scope.test_stuffs.source[quest_index];
        $scope.test_stuffs.current_question = word;
        $scope.test_stuffs.question_1 = "question 1 ne";
        $scope.test_stuffs.question_2 = "question 2 ne";
        $scope.test_stuffs.question_3 = "question 3 ne";
        $scope.test_stuffs.question_4 = "question 4 ne";
        $scope.test_stuffs.question_5 = "question 5 ne";
       
    }

    $scope.startTest = function()
    {  
        $scope.test_stuffs.header = "Generating Question List...";
        $http({
            method: 'get',
            url: "/api/gettestdata?number="+$scope.test_stuffs.number_of_question+"&choosenby="+$scope.test_stuffs.choosen_by,
           
        }).then(function successCallback(response) {
            $scope.test_stuffs.source = response.data;
            $scope.test_stuffs.current_question_number = 0;
            $scope.test_stuffs.header = "";
        });
    }
    $scope.test_submit = function(){
        //TODO
        $scope.test_stuffs.multiple_choice_correct_answer = 1;
    }
    $scope.test_load_next_question = function(){
        if ($scope.test_stuffs.current_question_number +1 < parseInt($scope.test_stuffs.number_of_question))
        {
            $scope.test_stuffs.current_question_number += 1;
        }
    }
    $scope.test_load_previous_question = function(){
        
    }

    //##########################################

    $scope.$on('$locationChangeStart', function () {
        if ($location.search().data != undefined) {
            $scope.input_text = $location.search().data;
            getResponse($location.search().data);
        }
    });

}]);