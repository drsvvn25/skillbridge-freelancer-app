angular.module('FreelancerApp')
.controller('PostTaskCtrl', ['$scope', '$rootScope', '$location', 'TaskService',
function($scope, $rootScope, $location, TaskService) {

  if (!$rootScope.isClient()) { $location.path('/marketplace'); return; }

  $scope.taskData = { urgency: 'normal' };
  $scope.previewPhases = [];
  $scope.categories = [];
  $scope.loading = false;
  $scope.errorMsg = '';
  $scope.skillInput = '';
  $scope.requiredSkills = [];

  TaskService.getCategories().then(function(res) { $scope.categories = res.data; });

  $scope.onCategoryChange = function() {
    if (!$scope.taskData.category) { $scope.previewPhases = []; return; }
    TaskService.getPhases($scope.taskData.category)
      .then(function(res) { $scope.previewPhases = res.data.phases; })
      .catch(function() { $scope.previewPhases = []; });
  };

  $scope.addSkill = function() {
    const s = ($scope.skillInput || '').trim();
    if (s && !$scope.requiredSkills.includes(s)) { $scope.requiredSkills.push(s); $scope.skillInput = ''; }
  };
  $scope.removeSkill = function(idx) { $scope.requiredSkills.splice(idx, 1); };

  $scope.getCommission   = function() { return (($scope.taskData.budget || 0) * 0.10).toFixed(2); };
  $scope.getFreelancerNet = function() { return (($scope.taskData.budget || 0) * 0.90).toFixed(2); };

  $scope.submitTask = function() {
    if ($scope.taskForm.$invalid) return;
    $scope.loading = true;
    $scope.errorMsg = '';
    const payload = { ...$scope.taskData, required_skills: $scope.requiredSkills };
    TaskService.create(payload)
      .then(function() {
        $rootScope.showToast('Task posted! Freelancers will apply soon 🚀');
        $location.path('/dashboard');
      })
      .catch(function(err) { $scope.errorMsg = (err.data && err.data.message) || 'Failed to post task.'; })
      .finally(function() { $scope.loading = false; });
  };
}]);
