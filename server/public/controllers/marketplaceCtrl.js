angular.module('FreelancerApp')
.controller('MarketplaceCtrl', ['$scope', '$rootScope', '$location', '$timeout', 'TaskService', 'ApplicationService',
function($scope, $rootScope, $location, $timeout, TaskService, ApplicationService) {

  $scope.tasks = [];
  $scope.allFetchedTasks = [];
  $scope.categories = [];

  $scope.loading = true;
  $scope.search = '';
  $scope.selectedCategory = '';
  $scope.selectedStatus = '';
  $scope.budgetRange = ''; // '', 'under-100', '100-500', 'above-500'
  $scope.sortBy = 'newest'; // 'newest', 'budget-high', 'budget-low', 'urgency', 'applicants'

  $scope.showApplyModal = false;
  $scope.selectedTask = null;
  $scope.applyData = {
    proposalText: '',
    bidAmount: null
  };
  $scope.matchFilter = '';

  $scope.appliedTaskIds = [];
  const currentUser = $rootScope.currentUser;

  // Load categories
  TaskService.getCategories().then(function(res) {
    $scope.categories = res.data;
  });

  // Debounced search
  var searchTimeout = null;
  $scope.onSearchChange = function() {
    if (searchTimeout) $timeout.cancel(searchTimeout);
    searchTimeout = $timeout(function() {
      $scope.fetchTasks();
    }, 300);
  };

  // Helper: Format Time Ago (Upwork style e.g. "Posted 2h ago")
  $scope.timeAgo = function(dateStr) {
    if (!dateStr) return '';
    const now = new Date();
    const past = new Date(dateStr);
    const diffMs = now - past;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return diffMin + 'm ago';
    if (diffHr < 24) return diffHr + 'h ago';
    if (diffDay === 1) return 'Yesterday';
    if (diffDay < 30) return diffDay + 'd ago';
    return past.toLocaleDateString();
  };

  // Filter & Sort Logic
  $scope.applyFiltersAndSort = function() {
    let list = [...$scope.allFetchedTasks];

    // 1. Budget Range Filter
    if ($scope.budgetRange === 'under-100') {
      list = list.filter(t => t.budget < 100);
    } else if ($scope.budgetRange === '100-500') {
      list = list.filter(t => t.budget >= 100 && t.budget <= 500);
    } else if ($scope.budgetRange === 'above-500') {
      list = list.filter(t => t.budget > 500);
    }

    // 2. Sort By
    if ($scope.sortBy === 'newest') {
      list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if ($scope.sortBy === 'budget-high') {
      list.sort((a, b) => b.budget - a.budget);
    } else if ($scope.sortBy === 'budget-low') {
      list.sort((a, b) => a.budget - b.budget);
    } else if ($scope.sortBy === 'urgency') {
      list.sort((a, b) => (b.urgency === 'urgent' ? 1 : 0) - (a.urgency === 'urgent' ? 1 : 0));
    } else if ($scope.sortBy === 'applicants') {
      list.sort((a, b) => ((b.applications || []).length) - ((a.applications || []).length));
    }

    // 3. Best Match filter for freelancers
    if ($scope.matchFilter === 'high') {
      list = list.filter(t => t.matchScore >= 70);
    }

    $scope.tasks = list;
  };

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

        // Calculate Match Score for Freelancers
        if ($rootScope.isFreelancer() && currentUser && currentUser.skills) {
          tasks = tasks.map(t => {
            const taskSkills = (t.required_skills && t.required_skills.length ? t.required_skills : [t.category]).map(s => s.toLowerCase());
            const userSkills = (currentUser.skills || []).map(s => s.toLowerCase());
            const matched = taskSkills.filter(s => userSkills.some(u => u.includes(s) || s.includes(u))).length;
            const score = taskSkills.length > 0 ? Math.round(matched / taskSkills.length * 100) : 0;
            return { ...t, matchScore: score };
          });
        }

        $scope.allFetchedTasks = tasks;
        $scope.applyFiltersAndSort();

        // Track applied tasks
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
    return (task.client_id && (task.client_id._id || task.client_id) === currentUser._id) ||
           (task.freelancer_id && (task.freelancer_id._id || task.freelancer_id) === currentUser._id);
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
