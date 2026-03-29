angular.module('FreelancerApp')
.controller('DashboardCtrl', ['$scope', '$rootScope', '$http', '$location', '$anchorScroll', '$timeout', 'TaskService', 'ApplicationService', 'SubmissionService',
function($scope, $rootScope, $http, $location, $anchorScroll, $timeout, TaskService, ApplicationService, SubmissionService) {

  $scope.tasks = [];
  $scope.loading = true;
  $scope.activeTab = 'all'; // Default to all tasks so clients instantly see their newly posted open tasks
  $scope.stats = { total: 0, active: 0, completed: 0, totalPenalty: 0 };
  $scope.submissions = {};
  $scope.submissionNote = {};
  $scope.selectedFiles = {};

  const currentUser = $rootScope.currentUser;
  const colors = ['#1dbf73','#3b82f6','#8b5cf6','#f59e0b','#ef4444'];
  $scope.getAvatarColor = (name) => colors[(name||'A').charCodeAt(0) % colors.length];
  $scope.getInitials = (name) => (name||'?').split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2);

  // ── Countdown helpers ──────────────────────────────────
  $scope.getMinutesLeft = function(phase) {
    if (!phase.started_at) return Infinity;
    const end = new Date(phase.started_at).getTime() + phase.deadline_minutes * 60000;
    return Math.floor((end - Date.now()) / 60000);
  };
  $scope.formatCountdown = function(phase) {
    const m = $scope.getMinutesLeft(phase);
    if (m <= 0) return 'OVERDUE';
    return m > 60 ? Math.floor(m/60) + 'h ' + (m%60) + 'm left' : m + 'm left';
  };
  $scope.countdownClass = function(phase) {
    const m = $scope.getMinutesLeft(phase);
    if (m <= 0) return 'danger';
    if (m <= 30) return 'warning';
    return 'safe';
  };

  // ── Filtered & Sorted Tasks ──────────────────────────
  const statusRank = { 'in_progress': 0, 'open': 1, 'completed': 2, 'cancelled': 2 };

  $scope.filteredTasks = function() {
    let list = $scope.tasks;
    if ($scope.activeTab === 'active')    list = $scope.tasks.filter(t => t.status === 'in_progress');
    if ($scope.activeTab === 'open')      list = $scope.tasks.filter(t => t.status === 'open');
    if ($scope.activeTab === 'completed') list = $scope.tasks.filter(t => t.status === 'completed' || t.status === 'cancelled');

    // Sort: Progress Rank -> Phase Index (desc) -> Creation Date (desc)
    return list.sort((a, b) => {
      const rankA = statusRank[a.status] ?? 10;
      const rankB = statusRank[b.status] ?? 10;
      if (rankA !== rankB) return rankA - rankB;
      if (a.status === 'in_progress' && b.status === 'in_progress') {
        return b.current_phase_index - a.current_phase_index;
      }
      return new Date(b.created_at) - new Date(a.created_at);
    });
  };

  // ── Activity Feed ─────────────────────────────────────
  $scope.activities = [];
  function buildActivity(tasks) {
    $scope.activities = [];
    tasks.forEach(t => {
      if (t.status === 'in_progress') $scope.activities.push({ color:'blue', text:`"${t.title}" is in progress — Phase ${t.current_phase_index+1}`, time:'active' });
      if (t.status === 'completed')   $scope.activities.push({ color:'green', text:`"${t.title}" was completed successfully!`, time:'done' });
      if (t.penalty_applied > 0)      $scope.activities.push({ color:'red',   text:`$${t.penalty_applied} penalty applied on "${t.title}"`, time:'penalty' });
    });
  }

  // ── Load Dashboard (SPA/AJAX Refresh) ───────────────────
  $scope.lastUpdated = new Date();

  function loadDashboard(isInitial = true) {
    if (isInitial) $scope.loading = true;

    const params = $rootScope.isClient()
      ? { client_id: currentUser._id }
      : { freelancer_id: currentUser._id };

    TaskService.getAll(params).then(function(res) {
      $scope.tasks = res.data;
      $scope.lastUpdated = new Date();
      $scope.stats.total     = res.data.length;
      $scope.stats.active    = res.data.filter(t => t.status === 'in_progress').length;
      $scope.stats.completed = res.data.filter(t => t.status === 'completed').length;
      $scope.stats.totalPenalty = res.data.reduce((s, t) => s + (t.penalty_applied || 0), 0);
      buildActivity(res.data);

      // Fetch submissions for active tasks
      res.data.filter(t => t.status === 'in_progress').forEach(task => {
        SubmissionService.getForTask(task._id)
          .then(r => { $scope.submissions[task._id] = r.data; });
      });

      // Handle taskId navigation from marketplace
      var navTaskId = $location.search().taskId;
      if (navTaskId && isInitial) {
        $scope.activeTab = 'all';
        $scope.highlightedTaskId = navTaskId;
        
        $timeout(function() {
          $anchorScroll('task-' + navTaskId);
          // Remove highlight after 5 seconds
          $timeout(function() {
            $scope.highlightedTaskId = null;
          }, 5000);
        }, 400);
      }
    }).catch(err => {
      console.error('Refresh failed:', err);
    }).finally(() => {
      if (isInitial) $scope.loading = false;
    });
  }

  // Initial load
  loadDashboard(true);

  // SPA Auto-refresh (AJAX based) every 30 seconds
  const autoRefreshTimer = setInterval(() => {
    loadDashboard(false);
  }, 30000);

  $scope.$on('$destroy', () => clearInterval(autoRefreshTimer));

  $scope.getSubmissionsForPhase = (taskId, idx) =>
    ($scope.submissions[taskId] || []).filter(s => s.phase_index === idx);

  // ── File Upload ───────────────────────────────────────
  $scope.uploadSubmission = function($event, task, phaseIdx) {
    $event.preventDefault();
    const slotKey = task._id + '-' + phaseIdx;
    const fileInput = document.getElementById('file-' + slotKey);
    if (!fileInput || !fileInput.files || !fileInput.files[0]) {
      return $rootScope.showToast('Choose a file first', true);
    }
    const fd = new FormData();
    fd.append('file', fileInput.files[0]);
    fd.append('task_id', task._id);
    fd.append('phase_index', phaseIdx);
    fd.append('note', $scope.submissionNote[slotKey] || '');
    const token = localStorage.getItem('token');
    $http.post('/api/submissions', fd, {
      headers: { 'Content-Type': undefined, 'Authorization': 'Bearer ' + token },
      transformRequest: angular.identity,
    }).then(function() {
      $rootScope.showToast('Work submitted! ✅');
      fileInput.value = '';
      $scope.selectedFiles[slotKey] = '';
      $scope.submissionNote[slotKey] = '';
      SubmissionService.getForTask(task._id).then(r => { $scope.submissions[task._id] = r.data; });
    }).catch(function(err) { $rootScope.showToast((err.data&&err.data.message)||'Upload failed', true); });
  };

  // ── Approve Submission ────────────────────────────────
  $scope.approveSubmission = function(sub) {
    SubmissionService.approve(sub._id)
      .then(function() { $rootScope.showToast('Phase approved! ✅ Next phase started.'); loadDashboard(); })
      .catch(function(err) { $rootScope.showToast((err.data&&err.data.message)||'Approval failed', true); });
  };

  // ── Accept Applicant ──────────────────────────────────
  $scope.acceptApplicant = function(application, task) {
    ApplicationService.accept(application._id)
      .then(function() { $rootScope.showToast('Freelancer hired! 🚀 Phase 1 timer started.'); loadDashboard(); })
      .catch(function(err) { $rootScope.showToast((err.data&&err.data.message)||'Failed to assign', true); });
  };

  // ── Cancel Task ───────────────────────────────────────
  $scope.cancelTask = function(task) {
    if (!confirm('Cancel this task?')) return;
    TaskService.update(task._id, { status: 'cancelled' })
      .then(function() { $rootScope.showToast('Task cancelled.'); loadDashboard(); });
  };
}]);
