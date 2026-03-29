angular.module('FreelancerApp')
  .controller('MessagesCtrl', ['$scope', '$rootScope', '$routeParams', '$interval', 'TaskService', 'MessageService',
    function ($scope, $rootScope, $routeParams, $interval, TaskService, MessageService) {

      const taskId = $routeParams.taskId;
      $scope.messages = [];
      $scope.task = null;
      $scope.msgContainer = { text: '' };
      $scope.loading = true;

      TaskService.getOne(taskId)
        .then(function (res) {
          $scope.task = res.data;
          $scope.loading = false;
          generatePhaseKeywords();
          loadMessages();
        })
        .catch(function () {
          $scope.loading = false;
        });

      function loadMessages() {
        MessageService.getForTask(taskId)
          .then(function (res) {
            $scope.messages = res.data;
            MessageService.markRead(taskId).catch(function() {});
            setTimeout(function() {
              var el = document.getElementById('messagesBody');
              if (el) el.scrollTop = el.scrollHeight;
            }, 60);
          });
      }

      function generatePhaseKeywords() {
        $scope.phaseKeywords = [];
        if (!$scope.task || !$scope.task.phases || $scope.task.phases.length === 0) {
          $scope.phaseKeywords = ['Hello!', 'Any updates?', 'Looks good', 'Need changes'];
          return;
        }
        var currentPhase = $scope.task.phases[$scope.task.current_phase_index] || $scope.task.phases[0];
        if (currentPhase) {
          var name = currentPhase.name.length > 20 ? currentPhase.name.substring(0, 20) + '...' : currentPhase.name;
          $scope.phaseKeywords.push('Starting [' + name + ']');
          $scope.phaseKeywords.push('[' + name + '] is Done');
          $scope.phaseKeywords.push('Please review [' + name + ']');
          $scope.phaseKeywords.push('Need revisions on [' + name + ']');
        }
      }

      $scope.populateMessage = function(text) {
        $scope.msgContainer.text = text;
        setTimeout(function() {
          var el = document.getElementById('messageInput');
          if (el) el.focus();
        }, 50);
      };

      $scope.clearHistory = function() {
        if (!confirm('Are you sure you want to delete the entire chat history for this task? This cannot be undone.')) return;
        
        $scope.sending = true;
        MessageService.deleteForTask(taskId)
          .then(function(res) {
            $scope.messages = [];
            $rootScope.showToast('Chat history cleared successfully.');
          })
          .catch(function(err) {
            $rootScope.showToast('Failed to clear history', true);
          })
          .finally(function() {
            $scope.sending = false;
          });
      };

      var poller = $interval(loadMessages, 1500);
      $scope.$on('$destroy', function() {
        $interval.cancel(poller);
      });

      $scope.sendMessage = function () {
        var content = '';
        if ($scope.msgContainer.text) {
            content = String($scope.msgContainer.text).trim();
        }
        
        if (!content || !$scope.task || $scope.sending) return;

        $scope.sending = true;
        var task = $scope.task;
        var receiverId = null;

        if ($rootScope.isClient()) {
            receiverId = (task.freelancer_id && task.freelancer_id._id) ? task.freelancer_id._id : task.freelancer_id;
        } else {
            receiverId = (task.client_id && task.client_id._id) ? task.client_id._id : task.client_id;
        }

        var tid = task._id || taskId;
        
        console.log('Sending message...', { tid: tid, receiverId: receiverId, content: content });

        var matchedKeyword = null;
        if ($scope.phaseKeywords) {
          $scope.phaseKeywords.forEach(function(kw) {
            if (content.indexOf(kw) !== -1) matchedKeyword = kw;
          });
        }

        MessageService.send(tid, receiverId, content)
          .then(function (res) {
            var newMsg = res.data;
            if (!newMsg.created_at) newMsg.created_at = new Date().toISOString();
            $scope.messages.push(newMsg);
            $scope.msgContainer.text = '';
            
            // Actionable Keywords: Update DB
            if (matchedKeyword) {
              var status = matchedKeyword.indexOf('is Done') !== -1 ? 'completed' : 'active';
              console.log('Keyword match detected, updating phase...', { status: status });
              
              TaskService.updatePhase(tid, task.current_phase_index, status)
                .then(function() {
                  return TaskService.getOne(tid);
                })
                .then(function(taskRes) {
                  $scope.task = taskRes.data;
                  generatePhaseKeywords();
                  console.log('Task progress updated via keyword.');
                });
            }
            
            setTimeout(function() {
              var el = document.getElementById('messagesBody');
              if (el) {
                if (el.scrollTo) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
                else el.scrollTop = el.scrollHeight;
              }
            }, 100);
          })
          .catch(function (err) {
            console.error('Failed to send message:', err);
            var errMsg = (err && err.data && err.data.message) ? err.data.message : 'Send failed';
            $rootScope.showToast(errMsg, true);
          })
          .finally(function() {
            $scope.sending = false;
          });
      };

      $scope.sendOnEnter = function (e) {
        if (e.keyCode === 13 && !e.shiftKey) {
          e.preventDefault();
          $scope.sendMessage();
        }
      };

      $scope.isMine = function (msg) {
        var user = $rootScope.currentUser;
        if (!msg || !user) return false;
        var sid = String((msg.sender_id && msg.sender_id._id) ? msg.sender_id._id : (msg.sender_id || ''));
        var myId = String(user._id || user.id || '');
        return sid === myId && myId !== '';
      };
    }]);
