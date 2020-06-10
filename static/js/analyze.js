var app = angular.module('analyze', ['ui.bootstrap', 'ngMaterial', 'ngMessages', 'ngSanitize']);
app.config(function ($interpolateProvider) {
    $interpolateProvider.startSymbol('[[').endSymbol(']]');
});
app.controller('analyzeController', ['$scope', '$http', '$location', '$mdDialog', '$window', function ($scope, $http, $location, $mdDialog, $window) {
    $scope.init = function(){
        $scope.input = {};
        $scope.output = {};
    };

    $scope.getAlanyzeResult = function(){
        var req = {
            method: 'get',
            url: '/api/analyze?entry='+ $scope.input.input_text,
            headers: {
                'Content-Type': 'application/json'
            }
        }
        console.log($scope.new_english_root_node);

        $http(req).then(function successCallback(response) {
            $scope.output.analyze_result = response.data;
        });
    }
}]);