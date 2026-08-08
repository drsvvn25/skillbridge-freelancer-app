angular.module('FreelancerApp')
.controller('HomeCtrl', ['$scope', '$location',
function($scope, $location) {

  // Static stats for hero section (no API call — home page is public)
  $scope.stats = {
    totalTasks: 150,
    totalFreelancers: 80
  };

  // Category showcase
  $scope.categories = [
    { icon: '🎨', name: 'Design & Creative',  count: 24 },
    { icon: '💻', name: 'Web Development',    count: 38 },
    { icon: '📱', name: 'Mobile Apps',         count: 15 },
    { icon: '✍️', name: 'Content Writing',     count: 20 },
    { icon: '📈', name: 'Digital Marketing',   count: 17 },
    { icon: '🎬', name: 'Video & Animation',   count: 11 },
    { icon: '🔐', name: 'Cybersecurity',       count: 8  },
    { icon: '🤖', name: 'AI & Data Science',   count: 13 }
  ];

  $scope.goToLogin = function() {
    $location.path('/login');
  };
}]);
