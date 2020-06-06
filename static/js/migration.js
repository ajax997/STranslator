var app = angular.module('migration', ['ui.bootstrap', 'ngMaterial', 'ngMessages', 'ngSanitize']);
app.config(function ($interpolateProvider) {
    $interpolateProvider.startSymbol('[[').endSymbol(']]');
});
app.controller('migrationController', ['$scope', '$http', '$location', '$mdDialog', '$window', function ($scope, $http, $location, $mdDialog, $window) {
    function getListWord() {

        $http({
            method: 'GET',
            url: "/migration/get-list-words",
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            dataType: "json"
        }).then(function successCallback(response) {
            $scope.config.list_words = response.data;
            $scope.config.current_word_index = 0;
            if ($location.search().data != undefined) {
                $scope.config.current_word_index = $scope.config.list_words.indexOf($location.search().data);
            }



            changeUI($location.search().data);
        });

    }

    function getAvailableMeaning(url) {

        $http({
            method: 'GET',
            url: url,
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            dataType: "json"
        }).then(function successCallback(response) {
            $scope.returned_data.vn_meanings = response.data.m_vn.jsondata;
            $scope.returned_data.viewing_of = response.data.m_vn.meta.r_header;
            $scope.returned_data.viewing_of_node_id = response.data.m_eng.meta.root_id;
        });

    }

    function getMigrationData(url) {

        $http({
            method: 'GET',
            url: url,
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            dataType: "json"
        }).then(function successCallback(response) {
            $scope.migration_data.data = response.data[1];
            $scope.migration_data.examples = response.data[0];
        });

    }

    $scope.init = function () {
        $scope.config = {};
        $scope.returned_data = {};
        $scope.migration_data = {};
        $scope.selected_data = {};
        //getListWord();


    }
    $scope.nextWord = function () {

        if ($scope.config.current_word_index + 1 < $scope.config.list_words.length) {
            $scope.config.current_word_index += 1;
            $location.url($location.path() + "?data=" + $scope.config.list_words[$scope.config.current_word_index]);
        }
    }

    function changeUI(word) {

        $scope.config.selected_word = $scope.config.list_words[$scope.config.current_word_index];
        getAvailableMeaning("/api/get?entry=" + word);
        getMigrationData("/api/migration?data=" + word);

    }
    $scope.migrateMeaning = function (pos_id, m_id, tag_id, inline_id) {
        var saving_pos = document.getElementById(pos_id).value;
        var saving_m = document.getElementById(m_id).value.replace(/_/g, " ");
        var saving_tags_raw = (document.getElementById(tag_id).value + "")
            .split("|");
        var saving_inline = document.getElementById(inline_id).value;
        var saving_freq = 1;
        var saving_tags = [];
        saving_tags_raw.forEach(element => {
            saving_tags.push(element.trim());
        });
        var tobe_sent = {
            from_node_id: $scope.returned_data.viewing_of_node_id,
            new_node_details: {
                pos: saving_pos,
                m: saving_m,
                tags: saving_tags,
                inline: saving_inline,
                freq: saving_freq
            }
        };
        console.log(tobe_sent);
        if (saving_pos == "") {
            alert("Please choose a POS");
            return;
        } else {
            var req = {
                method: 'POST',
                url: '/manage/add_meaning',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: tobe_sent
            }


            $http(req).then(function successCallback(response) {
                    
            });
        }




    }

    $scope.$on('$locationChangeStart', function () {
        console.log("first?");
        if ($location.search().data != undefined) {
            getListWord();
        }
    });

}]);