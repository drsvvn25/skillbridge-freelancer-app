angular.module('FreelancerApp')
.controller('ProfileCtrl', ['$scope', '$rootScope', 'UserService',
function($scope, $rootScope, UserService) {

  $scope.profile = null;
  $scope.loading = true;
  $scope.editing = false;
  $scope.editData = {};
  $scope.newSkill = '';

  // Tab switching: 'overview' vs 'reviews'
  $scope.activeTab = 'overview';

  // Portfolio modal state
  $scope.showPortfolioModal = false;
  $scope.portfolioForm = {
    title: '',
    description: '',
    project_url: '',
    image_url: ''
  };
  $scope.savingPortfolio = false;

  const colors = ['#1dbf73','#3b82f6','#8b5cf6','#f59e0b','#ef4444','#10b981','#06b6d4'];
  $scope.avatarColor = function(name) {
    return colors[(name || 'A').charCodeAt(0) % colors.length];
  };

  UserService.getProfile()
    .then(function(res) {
      $scope.profile = res.data;
      $scope.syncEditData(res.data);
    })
    .catch(function() {
      $scope.profile = $rootScope.currentUser;
      $scope.syncEditData($scope.profile);
    })
    .finally(function() { $scope.loading = false; });

  $scope.syncEditData = function(p) {
    $scope.editData = {
      bio: (p && p.bio) || '',
      professional_title: (p && p.professional_title) || '',
      hourly_rate: (p && p.hourly_rate) || 0,
      skills: [...((p && p.skills) || [])]
    };
  };

  $scope.startEdit = function() {
    $scope.syncEditData($scope.profile);
    $scope.editing = true;
  };
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
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        Object.assign(stored, res.data);
        localStorage.setItem('user', JSON.stringify(stored));
        $rootScope.currentUser = stored;
        $scope.editing = false;
        $rootScope.showToast('Profile updated! ✅');
      })
      .catch(function() { $rootScope.showToast('Failed to update profile', true); });
  };

  // ── Portfolio Management ──────────────────────────────
  $scope.openAddPortfolio = function() {
    $scope.portfolioForm = {
      title: '',
      description: '',
      project_url: '',
      image_url: ''
    };
    $scope.savingPortfolio = false;
    $scope.showPortfolioModal = true;
  };

  $scope.closePortfolioModal = function() {
    $scope.showPortfolioModal = false;
  };

  $scope.savePortfolioItem = function() {
    if (!$scope.portfolioForm.title) return;
    $scope.savingPortfolio = true;

    UserService.addPortfolioItem($scope.portfolioForm)
      .then(function(res) {
        $scope.profile.portfolio = res.data;
        $scope.closePortfolioModal();
        $rootScope.showToast('Portfolio project added! 🎨');
      })
      .catch(function(err) {
        $rootScope.showToast((err.data && err.data.message) || 'Failed to add project', true);
      })
      .finally(function() {
        $scope.savingPortfolio = false;
      });
  };

  $scope.deletePortfolioItem = function(itemId) {
    if (!confirm('Remove this portfolio project?')) return;
    UserService.deletePortfolioItem(itemId)
      .then(function(res) {
        $scope.profile.portfolio = res.data;
        $rootScope.showToast('Project removed 🗑️');
      })
      .catch(function() {
        $rootScope.showToast('Failed to delete item', true);
      });
  };

  $scope.getInitials = function(name) {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  $scope.upgradeToPremium = function() {
    UserService.updateProfile({ is_premium: true })
      .then(function(res) {
        $scope.profile = res.data;
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        Object.assign(stored, res.data);
        localStorage.setItem('user', JSON.stringify(stored));
        $rootScope.currentUser = stored;
        $rootScope.showToast('🚀 Account upgraded to Premium!');
      })
      .catch(function() { $rootScope.showToast('Failed to upgrade account', true); });
  };

  // ── Verified Client / Freelancer Reviews ────────────────
  $scope.reviews = [];
  $scope.loadingReviews = true;

  function loadReviews() {
    UserService.getReviews()
      .then(function(res) {
        $scope.reviews = res.data || [];
      })
      .catch(function() {
        $scope.reviews = [];
      })
      .finally(function() {
        $scope.loadingReviews = false;
      });
  }

  loadReviews();
}]);
