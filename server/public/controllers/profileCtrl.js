angular.module('FreelancerApp')
.controller('ProfileCtrl', ['$scope', '$rootScope', 'UserService',
function($scope, $rootScope, UserService) {

  $scope.profile = null;
  $scope.loading = true;
  $scope.editing = false;
  $scope.editData = {};
  $scope.newSkill = '';

  const colors = ['#1dbf73','#3b82f6','#8b5cf6','#f59e0b','#ef4444','#10b981','#06b6d4'];
  $scope.avatarColor = function(name) {
    return colors[(name || 'A').charCodeAt(0) % colors.length];
  };

  UserService.getProfile()
    .then(function(res) {
      $scope.profile = res.data;
      $scope.editData = { bio: res.data.bio, skills: [...(res.data.skills || [])] };
    })
    .catch(function() {
      // fallback to rootScope user
      $scope.profile = $rootScope.currentUser;
      $scope.editData = { bio: $scope.profile.bio || '', skills: [...($scope.profile.skills || [])] };
    })
    .finally(function() { $scope.loading = false; });

  $scope.startEdit = function() { $scope.editing = true; };
  $scope.cancelEdit = function() { $scope.editing = false; };

  $scope.addSkill = function() {
    const s = ($scope.newSkill || '').trim();
    if (s && !$scope.editData.skills.includes(s)) {
      $scope.editData.skills.push(s);
      $scope.newSkill = '';
    }
  };
  $scope.removeSkill = function(idx) { $scope.editData.skills.splice(idx, 1); };

  $scope.saveProfile = function() {
    UserService.updateProfile($scope.editData)
      .then(function(res) {
        $scope.profile = res.data;
        // Update localStorage user
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        Object.assign(stored, res.data);
        localStorage.setItem('user', JSON.stringify(stored));
        $rootScope.currentUser = stored;
        $scope.editing = false;
        $rootScope.showToast('Profile updated! ✅');
      })
      .catch(function() { $rootScope.showToast('Failed to update profile', true); });
  };

  $scope.getInitials = function(name) {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  $scope.upgradeToPremium = function() {
    UserService.updateProfile({ is_premium: true })
      .then(function(res) {
        $scope.profile = res.data;
        // Update localStorage user
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        Object.assign(stored, res.data);
        localStorage.setItem('user', JSON.stringify(stored));
        $rootScope.currentUser = stored;
        $rootScope.showToast('🚀 Account upgraded to Premium!');
      })
      .catch(function() { $rootScope.showToast('Failed to upgrade account', true); });
  };
}]);
