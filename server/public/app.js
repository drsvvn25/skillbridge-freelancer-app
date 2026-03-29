// =========================================================
// SkillBridge — AngularJS 1.8 Main Module
// =========================================================

angular.module('FreelancerApp', ['ngRoute', 'ngAnimate'])

// ─── Route Configuration ─────────────────────────────────
.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
  $locationProvider.hashPrefix('!');

  $routeProvider
    .when('/login',       { templateUrl: '/views/login.html',       controller: 'AuthCtrl' })
    .when('/register',    { templateUrl: '/views/register.html',     controller: 'AuthCtrl' })
    .when('/marketplace', { templateUrl: '/views/marketplace.html',  controller: 'MarketplaceCtrl' })
    .when('/post-task',   { templateUrl: '/views/post-task.html',    controller: 'PostTaskCtrl' })
    .when('/dashboard',   { templateUrl: '/views/dashboard.html',    controller: 'DashboardCtrl' })
    .when('/messages/:taskId', { templateUrl: '/views/messages.html?v=5', controller: 'MessagesCtrl' })
    .when('/leaderboard', { templateUrl: '/views/leaderboard.html',  controller: 'LeaderboardCtrl' })
    .when('/profile',     { templateUrl: '/views/profile.html',      controller: 'ProfileCtrl' })
    .otherwise({ redirectTo: '/marketplace' });
}])

// ─── HTTP Interceptor (attach JWT) ───────────────────────
.factory('authInterceptor', ['$rootScope', '$location', function($rootScope, $location) {
  return {
    request: function(config) {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers = config.headers || {};
        config.headers['Authorization'] = 'Bearer ' + token;
      }
      return config;
    },
    responseError: function(rejection) {
      if (rejection.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        $location.path('/login');
      }
      return Promise.reject(rejection);
    }
  };
}])
.config(['$httpProvider', function($httpProvider) {
  $httpProvider.interceptors.push('authInterceptor');
}])

// ─── Auth Service ─────────────────────────────────────────
.factory('AuthService', ['$http', '$rootScope', '$location', function($http, $rootScope, $location) {
  return {
    login: function(email, password) {
      return $http.post('/api/auth/login', { email: email, password: password });
    },
    register: function(data) {
      return $http.post('/api/auth/register', data);
    },
    logout: function() {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      $rootScope.currentUser = null;
      $location.path('/login');
    },
    getUser: function() {
      var u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    },
    isLoggedIn: function() {
      return !!localStorage.getItem('token');
    },
    saveSession: function(user, token) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      $rootScope.currentUser = user;
    }
  };
}])

// ─── Task Service ─────────────────────────────────────────
.factory('TaskService', ['$http', function($http) {
  return {
    getAll: function(params) {
      return $http.get('/api/tasks', { params: params });
    },
    getOne: function(id) {
      return $http.get('/api/tasks/' + id);
    },
    create: function(data) {
      return $http.post('/api/tasks', data);
    },
    update: function(id, data) {
      return $http.patch('/api/tasks/' + id, data);
    },
    assign: function(id, fId) {
      return $http.patch('/api/tasks/' + id + '/assign', { freelancer_id: fId });
    },
    getPhases: function(category) {
      return $http.get('/api/phases', { params: { category: category } });
    },
    getCategories: function() {
      return $http.get('/api/phases/categories');
    },
    getStats: function() {
      return $http.get('/api/tasks/stats');
    },
    getLeaderboard: function() {
      return $http.get('/api/tasks/leaderboard');
    },
    updatePhase: function(taskId, phaseIndex, status) {
      return $http.patch('/api/tasks/' + taskId + '/phases', { phaseIndex, status });
    }
  };
}])

// ─── Application Service ──────────────────────────────────
.factory('ApplicationService', ['$http', function($http) {
  return {
    apply: function(taskId, proposal, bidAmount) {
      return $http.post('/api/applications', {
        task_id: taskId,
        proposal_text: proposal,
        bid_amount: bidAmount
      });
    },
    accept: function(appId) {
      return $http.patch('/api/applications/' + appId + '/accept');
    }
  };
}])

// ─── Message Service ──────────────────────────────────────
.factory('MessageService', ['$http', function($http) {
  return {
    getForTask: function(taskId) {
      return $http.get('/api/messages/task/' + taskId);
    },
    send: function(taskId, receiverId, content) {
      return $http.post('/api/messages', {
        task_id: taskId,
        receiver_id: receiverId,
        content: content
      });
    },
    markRead: function(taskId) {
      return $http.patch('/api/messages/read/' + taskId);
    },
    deleteForTask: function(taskId) {
      return $http.delete('/api/messages/task/' + taskId);
    },
    getUnread: function() {
      return $http.get('/api/messages/unread-count');
    },
    getNotifications: function() {
      return $http.get('/api/messages/notifications');
    }
  };
}])

// ─── Submission Service ───────────────────────────────────
.factory('SubmissionService', ['$http', function($http) {
  return {
    getForTask: function(taskId) {
      return $http.get('/api/submissions/task/' + taskId);
    },
    approve: function(subId) {
      return $http.patch('/api/submissions/' + subId + '/approve');
    }
  };
}])

// ─── User Service ─────────────────────────────────────────
.factory('UserService', ['$http', function($http) {
  return {
    getProfile: function() {
      return $http.get('/api/users/me');
    },
    updateProfile: function(data) {
      return $http.patch('/api/users/me', data);
    },
    getLeaderboard: function() {
      return $http.get('/api/users/leaderboard');
    }
  };
}])

// ─── Custom Filters ───────────────────────────────────────
.filter('replace', function() {
  return function(str, find, rep) {
    if (!str) return '';
    return str.split(find).join(rep);
  };
})
.filter('truncate', function() {
  return function(str, len) {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '…' : str;
  };
})

// ─── Root Scope Setup ─────────────────────────────────────
.run(['$rootScope', '$location', 'AuthService', function($rootScope, $location, AuthService) {
  $rootScope.currentUser = AuthService.getUser();

  // Avatar colors
  var colors = ['#1dbf73','#3b82f6','#8b5cf6','#f59e0b','#ef4444','#10b981','#06b6d4'];
  $rootScope.avatarColor = colors[Math.floor(Math.random() * colors.length)];

  $rootScope.isLoggedIn = function() {
    return AuthService.isLoggedIn();
  };
  $rootScope.isClient = function() {
    return $rootScope.currentUser && $rootScope.currentUser.user_type === 'client';
  };
  $rootScope.isFreelancer = function() {
    return $rootScope.currentUser && $rootScope.currentUser.user_type === 'freelancer';
  };
  $rootScope.logout = function() {
    AuthService.logout();
  };

  // Toast notification
  $rootScope.toast = { show: false, message: '', isError: false };
  $rootScope.showToast = function(msg, isError) {
    if (isError === undefined) isError = false;
    $rootScope.toast = { show: true, message: msg, isError: isError };
    setTimeout(function() {
      $rootScope.$apply(function() {
        $rootScope.toast.show = false;
      });
    }, 3500);
  };

  // Route guard
  $rootScope.$on('$routeChangeStart', function(event, next) {
    var publicRoutes = ['/login', '/register'];
    var path = next.$$route && next.$$route.originalPath;
    if (!AuthService.isLoggedIn() && publicRoutes.indexOf(path) === -1) {
      $location.path('/login');
    }
  });

  // Track current path for active nav
  $rootScope.$on('$routeChangeSuccess', function() {
    $rootScope.currentPath = $location.path();
    $rootScope.showUserMenu = false;
    $rootScope.showNotifications = false;
  });
}]);
