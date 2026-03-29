angular.module('FreelancerApp')
.controller('LeaderboardCtrl', ['$scope', '$rootScope', 'UserService',
function($scope, $rootScope, UserService) {

  $scope.leaders = [];
  $scope.loading = true;

  UserService.getLeaderboard()
    .then(function(res) {
      $scope.leaders = res.data;
      const max = $scope.leaders[0] ? ($scope.leaders[0].total_earned || 1) : 1;
      $scope.leaders = $scope.leaders.map((l, i) => ({
        ...l,
        rank: i + 1,
        barWidth: Math.round((l.total_earned / max) * 100),
      }));
    })
    .catch(function(err) {
      console.error('Leaderboard error', err);
    })
    .finally(function() { $scope.loading = false; });

  $scope.getRankClass = function(rank) {
    if (rank === 1) return 'rank-1';
    if (rank === 2) return 'rank-2';
    if (rank === 3) return 'rank-3';
    return 'rank-other';
  };

  $scope.getAvatarColor = function(name) {
    const colors = ['#1dbf73','#3b82f6','#8b5cf6','#f59e0b','#ef4444'];
    return colors[(name || 'A').charCodeAt(0) % colors.length];
  };
}]);
