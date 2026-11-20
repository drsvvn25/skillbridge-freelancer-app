angular.module('FreelancerApp')
.controller('RootCtrl', ['$scope', '$rootScope', '$location', '$window', 'MessageService',
function($scope, $rootScope, $location, $window, MessageService) {

  const colors = ['#1dbf73','#3b82f6','#8b5cf6','#f59e0b','#ef4444','#10b981','#06b6d4'];
  $rootScope.avatarColor = colors[0];

  $scope.showUserMenu = false;
  $scope.showNotifications = false;
  $scope.scrolled = false;
  $scope.unreadCount = 0;

  // Dark / Light Mode
  $scope.darkMode = $window.localStorage.getItem('skillbridge-theme') === 'dark';
  $rootScope.darkMode = $scope.darkMode;

  $scope.toggleTheme = function() {
    $scope.darkMode = !$scope.darkMode;
    $rootScope.darkMode = $scope.darkMode;
    $window.localStorage.setItem('skillbridge-theme', $scope.darkMode ? 'dark' : 'light');
  };

  $scope.notifications = [];

  // Currency Selector
  $scope.currencyDropdownOpen = false;
  $scope.toggleCurrencyDropdown = function($event) {
    if ($event) {
      $event.preventDefault();
      $event.stopPropagation();
    }
    $scope.currencyDropdownOpen = !$scope.currencyDropdownOpen;
    $scope.showUserMenu = false;
    $scope.showNotifications = false;
    $scope.mobileMenuOpen = false;
  };

  $scope.selectCurrency = function(code, $event) {
    if ($event) $event.stopPropagation();
    $rootScope.setCurrency(code);
    $scope.currencyDropdownOpen = false;
  };

  // Fixed navbar scroll tracking with horizontal progress runner
  $scope.scrollProgress = 0;
  $scope.navHidden = false;

  angular.element($window).bind('scroll', function() {
    $scope.$apply(function() {
      var currentY = $window.scrollY || $window.pageYOffset || 0;
      $scope.scrolled = currentY > 15;

      // Calculate page scroll percentage (0 to 100)
      var docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (docHeight > 0) {
        var pct = (currentY / docHeight) * 100;
        $scope.scrollProgress = Math.min(100, Math.max(0, Math.round(pct)));
      } else {
        $scope.scrollProgress = 0;
      }
    });
  });

  $scope.mobileMenuOpen = false;

  $scope.toggleUserMenu = function($event) {
    if ($event) {
      $event.preventDefault();
      $event.stopPropagation();
    }
    $scope.showUserMenu = !$scope.showUserMenu;
    $scope.showNotifications = false;
    $scope.mobileMenuOpen = false;
  };

  $scope.toggleNotifications = function($event) {
    if ($event) {
      $event.preventDefault();
      $event.stopPropagation();
    }
    $scope.showNotifications = !$scope.showNotifications;
    $scope.showUserMenu = false;
    $scope.mobileMenuOpen = false;
    if ($scope.showNotifications) {
      $scope.unreadCount = 0;
      $scope.notifications.forEach(n => n.read = true);
    }
  };

  $scope.toggleMobileMenu = function($event) {
    if ($event) {
      $event.preventDefault();
      $event.stopPropagation();
    }
    $scope.mobileMenuOpen = !$scope.mobileMenuOpen;
    $scope.showUserMenu = false;
    $scope.showNotifications = false;
  };

  $scope.closeMenus = function() {
    $scope.showUserMenu = false;
    $scope.showNotifications = false;
    $scope.mobileMenuOpen = false;
  };

  // Close menus when clicking anywhere outside
  angular.element($window).bind('click', function(e) {
    if ($scope.showUserMenu || $scope.showNotifications || $scope.mobileMenuOpen) {
      $scope.$apply(function() {
        $scope.closeMenus();
      });
    }
  });

  // Load unread count and notifications
  function refreshUnread() {
    if ($rootScope.isLoggedIn()) {
      MessageService.getUnread().then(function(res) {
        $scope.unreadCount = res.data.count || 0;
      }).catch(() => {});
      
      MessageService.getNotifications().then(function(res) {
        $scope.notifications = res.data || [];
      }).catch(() => {});
    }
  }

  $rootScope.$on('$routeChangeSuccess', function() {
    $scope.closeMenus();
    refreshUnread();

    // Ensure currentUser is available
    if (!$rootScope.currentUser) {
      try {
        const u = localStorage.getItem('user');
        if (u) $rootScope.currentUser = JSON.parse(u);
      } catch (e) {}
    }

    // Set avatar color based on user
    if ($rootScope.currentUser) {
      const name = $rootScope.currentUser.full_name || 'A';
      const idx = name.charCodeAt(0) % colors.length;
      $rootScope.avatarColor = colors[idx];
    }
  });

  refreshUnread();
}]);
