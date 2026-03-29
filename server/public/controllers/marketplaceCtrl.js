angular.module('FreelancerApp')
.controller('MarketplaceCtrl', ['$scope', '$rootScope', '$location', 'TaskService', 'ApplicationService',
function($scope, $rootScope, $location, TaskService, ApplicationService) {

  $scope.tasks = [];
  $scope.categories = [];

  $scope.loading = true;
  $scope.search = '';
  $scope.selectedCategory = '';
  $scope.selectedStatus = '';
  $scope.sortBy = 'newest';

  $scope.showApplyModal = false;
  $scope.selectedTask = null;
  $scope.applyData = {
    proposalText: '',
    bidAmount: null
  };
  $scope.matchFilter = '';

  $scope.appliedTaskIds = [];
  const currentUser = $rootScope.currentUser;

  // Category stats for filter chips
  $scope.categoryStats = {};

  // Load categories
  TaskService.getCategories().then(function(res) {
    $scope.categories = res.data;
  });

  // Fetch Tasks (AJAX/JSON)
  $scope.fetchTasks = function() {
    $scope.loading = true;
    const params = {};
    if ($scope.search)           params.search = $scope.search;
    if ($scope.selectedCategory) params.category = $scope.selectedCategory;
    if ($scope.selectedStatus)   params.status = $scope.selectedStatus;

    TaskService.getAll(params)
      .then(function(res) {
        let tasks = res.data;

        // Sort
        if ($scope.sortBy === 'budget-high') tasks.sort((a,b) => b.budget - a.budget);
        if ($scope.sortBy === 'budget-low')  tasks.sort((a,b) => a.budget - b.budget);
        if ($scope.sortBy === 'applicants')  tasks.sort((a,b) => (b.applications||[]).length - (a.applications||[]).length);

        // Inject match score for freelancers
        if ($rootScope.isFreelancer() && currentUser && currentUser.skills) {
          tasks = tasks.map(t => {
            const taskSkills = (t.required_skills || [t.category]).map(s => s.toLowerCase());
            const userSkills = (currentUser.skills || []).map(s => s.toLowerCase());
            const matched = taskSkills.filter(s => userSkills.some(u => u.includes(s) || s.includes(u))).length;
            const score = taskSkills.length > 0 ? Math.round(matched / taskSkills.length * 100) : 0;
            return { ...t, matchScore: score };
          });
          if ($scope.matchFilter === 'high') tasks = tasks.filter(t => t.matchScore >= 70);
        }

        $scope.tasks = tasks;

        // Track applied
        if ($rootScope.isFreelancer() && currentUser) {
          $scope.appliedTaskIds = tasks
            .filter(t => t.applications && t.applications.some(a => {
              const fid = a.freelancer_id && (a.freelancer_id._id || a.freelancer_id);
              return fid === currentUser._id;
            }))
            .map(t => t._id);
        }
      })
      .catch(function(err) { console.error('fetch tasks error', err); })
      .finally(function() { $scope.loading = false; });
  };

  $scope.fetchTasks();

  $scope.hasApplied = function(task) { return $scope.appliedTaskIds.includes(task._id); };
  $scope.isInvolved = function(task) {
    if (!currentUser) return false;
    return (task.client_id && task.client_id._id === currentUser._id) ||
           (task.freelancer_id && (task.freelancer_id._id === currentUser._id));
  };

  $scope.getMatchClass = function(score) {
    if (score >= 70) return 'match-high';
    if (score >= 40) return 'match-mid';
    return 'match-low';
  };

  $scope.getLowestBid = function(task) {
    if (!task.applications || task.applications.length === 0) return null;
    const bids = task.applications.map(a => a.bid_amount).filter(b => b > 0);
    return bids.length ? Math.min(...bids) : null;
  };

  // Apply Modal
  $scope.applyToTask = function($event, task) {
    if ($event) $event.stopPropagation();
    $scope.selectedTask = task;
    $scope.applyData.proposalText = '';
    $scope.applyData.bidAmount = task.budget;
    $scope.showApplyModal = true;
  };

  $scope.submitApplication = function() {
    if (!$scope.applyData.proposalText) return;
    ApplicationService.apply($scope.selectedTask._id, $scope.applyData.proposalText, $scope.applyData.bidAmount)
      .then(function() {
        $rootScope.showToast('Application submitted! 🚀');
        $scope.showApplyModal = false;
        $scope.appliedTaskIds.push($scope.selectedTask._id);
        $scope.fetchTasks();
      })
      .catch(function(err) {
        $rootScope.showToast((err.data && err.data.message) || 'Failed to apply', true);
      });
  };

  $scope.viewInDashboard = function(task) {
    if ($rootScope.isFreelancer() && task.status === 'open' && !$scope.hasApplied(task)) {
      $scope.applyToTask(null, task);
    } else {
      $location.path('/dashboard').search({ taskId: task._id });
    }
  };
}]);

