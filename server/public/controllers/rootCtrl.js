angular.module('FreelancerApp')
.controller('RootCtrl', ['$scope', '$rootScope', '$location', '$window', 'MessageService',
function($scope, $rootScope, $location, $window, MessageService) {

  const colors = ['#1dbf73','#3b82f6','#8b5cf6','#f59e0b','#ef4444','#10b981','#06b6d4'];
  $rootScope.avatarColor = colors[0];

  $scope.showUserMenu = false;
  $scope.showNotifications = false;
  $scope.scrolled = false;
  $scope.unreadCount = 0;

  $scope.notifications = [];

  // Scroll detection for navbar shadow
  angular.element($window).bind('scroll', function() {
    $scope.$apply(function() {
      $scope.scrolled = $window.scrollY > 20;
    });
  });

  $scope.mobileMenuOpen = false;

  $scope.toggleUserMenu = function($event) {
    if ($event) $event.stopPropagation();
    $scope.showUserMenu = !$scope.showUserMenu;
    $scope.showNotifications = false;
    $scope.mobileMenuOpen = false;
  };

  $scope.toggleNotifications = function($event) {
    if ($event) $event.stopPropagation();
    $scope.showNotifications = !$scope.showNotifications;
    $scope.showUserMenu = false;
    $scope.mobileMenuOpen = false;
    if ($scope.showNotifications) {
      $scope.unreadCount = 0;
      $scope.notifications.forEach(n => n.read = true);
    }
  };

  $scope.toggleMobileMenu = function($event) {
    if ($event) $event.stopPropagation();
    $scope.mobileMenuOpen = !$scope.mobileMenuOpen;
    $scope.showUserMenu = false;
    $scope.showNotifications = false;
  };

  $scope.closeMenus = function() {
    $scope.showUserMenu = false;
    $scope.showNotifications = false;
    $scope.mobileMenuOpen = false;
  };

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
    refreshUnread();
    // Set avatar color based on user
    if ($rootScope.currentUser) {
      const name = $rootScope.currentUser.full_name || 'A';
      const idx = name.charCodeAt(0) % colors.length;
      $rootScope.avatarColor = colors[idx];
    }
  });

  refreshUnread();
}]);
