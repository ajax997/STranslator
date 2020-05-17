var app = angular.module('admin_page', ['ui.bootstrap', 'ngMaterial', 'ngMessages', 'ngSanitize']);
app.config(function ($interpolateProvider) {
    $interpolateProvider.startSymbol('[[').endSymbol(']]');
});
app.controller('adminPageControllerEditor', ['$scope', '$http', '$location', '$mdDialog', '$window', function ($scope, $http, $location, $mdDialog, $window) {
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


    function load_meaning_of_word(word) {
        var req = {
            method: 'get',
            url: '/api/get?entry=' + word,
            headers: {
                'Content-Type': 'application/json'
            },
            data: {}
        }
        $http(req).then(function successCallback(response) {
            console.log(response);
            $scope.translate_result = response.data.m_vn.jsondata;
        });
    }


    $scope.searchChanged = function (event) {
        var req = {
            method: 'get',
            url: '/api/search?entry=' + $scope.search_keyword,
            headers: {
                'Content-Type': 'application/json'
            },
            data: {}
        }
        $http(req).then(function successCallback(response) {
            $scope.search_results = response.data;
        });
    }

    //////// Search Seletion /////////

    $scope.searchSelect = function (index) {
        $scope.meaning_row.new_m_pos = "";
        $scope.meaning_row.new_m_meaning = "";
        $scope.meaning_row.new_m_tags = "";
        $scope.meaning_row.new_m_inline_explaination = "";

        $scope.selected_Keyword = $scope.search_results[index].keyword;
        $scope.selected_node = $scope.search_results[index].node_id;
        load_meaning_of_word($scope.selected_Keyword);
    };

    function checkLoginCredential() {
        $mdDialog.show({
            controller: DialogController,
            templateUrl: 'admin_login',
            scope: $scope,
            preserveScope: true,
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
    }

    $scope.loginOrSignup = function () {
        var req = {
            method: 'POST',
            url: '/manage/login',
            headers: {
                'Content-Type': 'application/json'
            },
            data: {
                'username': $scope.identity_username,
                'password': $scope.identity_password
            }
        }

        $http(req).then(function successCallback(response) {
            console.log(response.data);
            if (response.data != "false") {

                $scope.is_user_login = true;
                $scope.logged_username = response.data;
                $mdDialog.cancel();
            } else {

            }

        }, function () {

        });
    }

    $scope.delete_meaning = function (m_index) {

        if (confirm("Delete " + $scope.translate_result[m_index].m + "?")) {

            var req = {
                method: 'DELETE',
                url: '/manage/delete_relation',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: {
                    from_node_id: $scope.selected_node,
                    to_node_id: $scope.translate_result[m_index].node_id
                }
            }

            $http(req).then(function successCallback(response) {
                load_meaning_of_word($scope.selected_Keyword);
            });
        }
    };

    $scope.add_new_meaning = function () {
        if ($scope.meaning_row.new_m_meaning.trim() == "" || $scope.meaning_row.new_m_pos.trim() == "") {
            alert("Can't insert blank meaning or POS");
            return;
        }

        console.log($scope.meaning_row.new_m_pos);
        console.log($scope.meaning_row.new_m_meaning);
        console.log($scope.meaning_row.new_m_tags);
        console.log($scope.meaning_row.new_m_inline_explaination);

        var new_tags = [];
        var raw_tags = $scope.meaning_row.new_m_tags.split("|")
        for (var i = 0; i< raw_tags.length; i++)
        {
            new_tags.push(raw_tags[i].trim());
        }

        var req = {
            method: 'POST',
            url: '/manage/add_meaning',
            headers: {
                'Content-Type': 'application/json'
            },
            data: {
                from_node_id: $scope.selected_node,
                new_node_details: {
                    pos: $scope.meaning_row.new_m_pos,
                    m: $scope.meaning_row.new_m_meaning,
                    tags: new_tags,
                    inline: $scope.meaning_row.new_m_inline_explaination
                }
            }
        }

        $http(req).then(function successCallback(response) {
            load_meaning_of_word($scope.selected_Keyword);
        });
    };

    $scope.cancel_edit_form = function () {
        $mdDialog.cancel();
    }
    $scope.save_edit_form_changes = function () {
        var tobe_sent_data = {};
        tobe_sent_data.edited_pos = ["ObjectEntity", $scope.meaning_row_edit.new_m_pos];
        tobe_sent_data.edited_m = $scope.meaning_row_edit.new_m_meaning.trim();
        var edited_tags_raw = $scope.meaning_row_edit.new_m_tags.split("|");
        tobe_sent_data.edited_tags = [];
        for (var i = 0; i < edited_tags_raw.length; i++)
            tobe_sent_data.edited_tags.push(edited_tags_raw[i].trim());
        tobe_sent_data.edited_inline = $scope.meaning_row_edit.new_m_inline_explaination;
        tobe_sent_data.node_id = $scope.meaning_row_edit.node_id;
        console.log(tobe_sent_data);

        var req = {
            method: 'PATCH',
            url: 'api/update',
            headers: {
                'Content-Type': 'application/json'
            },
            data: {
                tobe_sent_data
            }
        }

        $http(req).then(function successCallback(response) {
            load_meaning_of_word($scope.selected_Keyword);
            $mdDialog.cancel();
        });

    }


    $scope.save_m_changes = function (event, m_index) {
        var node_id = $scope.translate_result[m_index].node_id;
        var node_details = $scope.translate_result[m_index];

        $scope.meaning_row_edit.node_id = node_id;
        var t_pos = $scope.translate_result[m_index].pos;
        for (var i = 0; i < t_pos.length; i++) {
            if (t_pos[i] != "ObjectEntity") {
                $scope.meaning_row_edit.new_m_pos = t_pos[i];
                break;
            }
        }
        $scope.meaning_row_edit.new_m_meaning = node_details.m;

        var t_tags = $scope.translate_result[m_index].tags;

        $scope.meaning_row_edit.new_m_tags = t_tags.join(" | ");

        $scope.meaning_row_edit.new_m_inline_explaination = node_details.inline_expl;

        $mdDialog.show({
            controller: DialogController,
            templateUrl: '/edit_meaning',
            scope: $scope,
            preserveScope: true,
            parent: angular.element(document.body),
            clickOutsideToClose: true
        });
    }

    $scope.init = function () {
        $scope.meaning_row_edit = {};
        $scope.meaning_row = {};
        $scope.selected_Keyword = "";
        $scope.selected_node = "";
        //checkLoginCredential();
    }



}]);