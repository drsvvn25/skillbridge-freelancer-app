angular.module('FreelancerApp')
.controller('AuthCtrl', ['$scope', '$rootScope', '$location', '$interval', 'AuthService',
function($scope, $rootScope, $location, $interval, AuthService) {

  if (AuthService.isLoggedIn()) { $location.path('/marketplace'); return; }

  // ── Shared state ──────────────────────────────────────
  $scope.credentials = {};
  $scope.formData = { user_type: 'client' };
  $scope.loading = false;
  $scope.errorMsg = '';
  $scope.successMsg = '';

  // ── OTP step state ────────────────────────────────────
  $scope.otpStep = false;       // true when we're on the OTP verification screen
  $scope.otpEmail = '';         // email to verify OTP for
  $scope.otpCode = '';          // OTP entered by user
  $scope.otpTimer = 600;        // 10 min countdown in seconds
  var otpInterval = null;

  function startOtpTimer() {
    $scope.otpTimer = 600;
    if (otpInterval) $interval.cancel(otpInterval);
    otpInterval = $interval(function() {
      $scope.otpTimer--;
      if ($scope.otpTimer <= 0) {
        $interval.cancel(otpInterval);
        $scope.otpTimer = 0;
      }
    }, 1000);
  }

  $scope.$on('$destroy', function() {
    if (otpInterval) $interval.cancel(otpInterval);
  });

  $scope.otpTimerLabel = function() {
    var m = Math.floor($scope.otpTimer / 60);
    var s = $scope.otpTimer % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  };

  // ── Login — Step 1 ────────────────────────────────────
  $scope.login = function() {
    if (!$scope.credentials.email) {
      $scope.errorMsg = 'Email address not found';
      return;
    }
    if (!$scope.credentials.password) {
      $scope.errorMsg = 'Password not found';
      return;
    }
    if ($scope.loginForm && $scope.loginForm.$invalid) return;

    $scope.loading = true;
    $scope.errorMsg = '';
    $scope.successMsg = '';

    AuthService.login($scope.credentials.email, $scope.credentials.password)
      .then(function(res) {
        if (res.data.step === 'otp') {
          // Move to OTP step
          $scope.otpEmail = res.data.email;
          $scope.otpStep = true;
          $scope.successMsg = '📧 OTP sent to ' + res.data.email + '. Check your inbox!';
          startOtpTimer();
        } else {
          // Fallback if no OTP (shouldn't happen)
          AuthService.saveSession(res.data.user, res.data.token);
          $rootScope.showToast('Welcome back, ' + res.data.user.full_name + '! 👋');
          $location.path('/marketplace');
        }
      })
      .catch(function(err) {
        $scope.errorMsg = (err.data && err.data.message) || 'Invalid email or password.';
      })
      .finally(function() { $scope.loading = false; });
  };

  // ── Login — Step 2: Verify OTP ────────────────────────
  $scope.verifyOtp = function() {
    if (!$scope.otpCode || $scope.otpCode.toString().length !== 6) {
      $scope.errorMsg = 'Please enter the 6-digit OTP sent to your email.';
      return;
    }
    $scope.loading = true;
    $scope.errorMsg = '';
    $scope.successMsg = '';

    AuthService.verifyOtp($scope.otpEmail, $scope.otpCode)
      .then(function(res) {
        if (otpInterval) $interval.cancel(otpInterval);
        AuthService.saveSession(res.data.user, res.data.token);
        $rootScope.showToast('Welcome back, ' + res.data.user.full_name + '! 👋');
        $location.path('/marketplace');
      })
      .catch(function(err) {
        $scope.errorMsg = (err.data && err.data.message) || 'Invalid or expired OTP.';
      })
      .finally(function() { $scope.loading = false; });
  };

  // ── Resend OTP ────────────────────────────────────────
  $scope.resendOtp = function() {
    $scope.errorMsg = '';
    $scope.successMsg = '';
    $scope.loading = true;
    AuthService.resendOtp($scope.otpEmail)
      .then(function() {
        $scope.successMsg = '📧 A new OTP has been sent to ' + $scope.otpEmail;
        $scope.otpCode = '';
        startOtpTimer();
      })
      .catch(function(err) {
        $scope.errorMsg = (err.data && err.data.message) || 'Failed to resend OTP.';
      })
      .finally(function() { $scope.loading = false; });
  };

  // ── Go back to login form ─────────────────────────────
  $scope.backToLogin = function() {
    $scope.otpStep = false;
    $scope.otpCode = '';
    $scope.errorMsg = '';
    $scope.successMsg = '';
    if (otpInterval) $interval.cancel(otpInterval);
  };

  // ── Register ──────────────────────────────────────────
  $scope.register = function() {
    if ($scope.registerForm.$invalid) return;
    $scope.loading = true;
    $scope.errorMsg = '';
    AuthService.register($scope.formData)
      .then(function(res) {
        AuthService.saveSession(res.data.user, res.data.token);
        $rootScope.showToast('Account created! Welcome to SkillBridge 🎉');
        $location.path('/marketplace');
      })
      .catch(function(err) { $scope.errorMsg = (err.data && err.data.message) || 'Registration failed. Try again.'; })
      .finally(function() { $scope.loading = false; });
  };
}]);
