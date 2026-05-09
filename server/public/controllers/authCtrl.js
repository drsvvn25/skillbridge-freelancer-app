angular.module('FreelancerApp')
.controller('AuthCtrl', ['$scope', '$rootScope', '$location', 'AuthService',
function($scope, $rootScope, $location, AuthService) {

  if (AuthService.isLoggedIn()) { $location.path('/marketplace'); return; }

  $scope.credentials = {};
  $scope.formData = { user_type: 'client' };
  $scope.loading = false;
  $scope.errorMsg = '';

  $scope.login = function() {
    if (!$scope.credentials.email) {
      $scope.errorMsg = 'email address not found';
      return;
    }
    if (!$scope.credentials.password) {
      $scope.errorMsg = 'password not found';
      return;
    }

    if ($scope.loginForm.$invalid) return;
    $scope.loading = true;
    $scope.errorMsg = '';
    AuthService.login($scope.credentials.email, $scope.credentials.password)
      .then(function(res) {
        AuthService.saveSession(res.data.user, res.data.token);
        $rootScope.showToast('Welcome back, ' + res.data.user.full_name + '! 👋');
        $location.path('/marketplace');
      })
      .catch(function(err) { $scope.errorMsg = (err.data && err.data.message) || 'Invalid email or password.'; })
      .finally(function() { $scope.loading = false; });
  };

  $scope.register = function() {
    if ($scope.registerForm.$invalid) return;
    $scope.loading = true;
    $scope.errorMsg = '';
    AuthService.register($scope.formData)
      .then(function(res) {
        AuthService.saveSession(res.data.user, res.data.token);
        $rootScope.showToast('Account created! Welcome to SkillBridge 🎉');
        $location.path('/marketplace');
      })
      .catch(function(err) { $scope.errorMsg = (err.data && err.data.message) || 'Registration failed. Try again.'; })
      .finally(function() { $scope.loading = false; });
  };
}]);
