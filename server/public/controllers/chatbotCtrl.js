// =========================================================
// SkillBridge — SkillBot Chatbot Controller
// =========================================================

angular.module('FreelancerApp')
.controller('ChatbotCtrl', ['$scope', '$rootScope', '$http', '$timeout', '$location',
function($scope, $rootScope, $http, $timeout, $location) {

  // ── State ─────────────────────────────────────────────────
  $scope.isOpen       = false;
  $scope.messages     = [];
  $scope.inputText    = '';
  $scope.isTyping     = false;
  $scope.hasNewMsg    = false;
  $scope.quickActions = [];
  $scope.progress     = null;  // { step, total } for task creation

  // ── Helpers ───────────────────────────────────────────────
  function isLoggedIn() {
    return !!localStorage.getItem('token');
  }
  function getUserType() {
    var u = localStorage.getItem('user');
    if (!u) return null;
    try { return JSON.parse(u).user_type; } catch(e) { return null; }
  }

  // ── Convert markdown-ish text to HTML ─────────────────────
  function markdownToHtml(text) {
    if (!text) return '';
    return text
      // Bold **text**
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic *text*
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Links [text](url)
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, function(match, linkText, url) {
        if (url.startsWith('#!/')) {
          return '<a href="' + url + '" class="chat-link" onclick="document.getElementById(\'skillbot-panel\').style.display=\'none\'">' + linkText + '</a>';
        }
        return '<a href="' + url + '" class="chat-link">' + linkText + '</a>';
      })
      // Horizontal rule ---
      .replace(/^---$/gm, '<hr class="chat-divider" />')
      // Newlines
      .replace(/\n/g, '<br>');
  }

  // ── Open/Close toggle ─────────────────────────────────────
  $scope.toggleChat = function() {
    $scope.isOpen = !$scope.isOpen;
    if ($scope.isOpen) {
      $scope.hasNewMsg = false;
      if ($scope.messages.length === 0) {
        $scope.sendWelcome();
      }
      $timeout(function() { scrollToBottom(); scrollToBottom(); }, 120);
    }
  };

  $scope.closeChat = function($event) {
    if ($event) $event.stopPropagation();
    $scope.isOpen = false;
  };

  // ── Welcome message on first open ─────────────────────────
  $scope.sendWelcome = function() {
    if (!isLoggedIn()) {
      addBotMsg(
        '👋 Hi! I\'m <strong>SkillBot</strong>, your SkillBridge assistant!<br><br>' +
        'SkillBridge connects talented freelancers with clients who need work done.<br><br>' +
        '🚀 <a href="#!/register" class="chat-link">Sign Up Free</a> &nbsp;|&nbsp; ' +
        '<a href="#!/login" class="chat-link">Log In</a>',
        []
      );
      return;
    }
    var userType = getUserType();
    var u = localStorage.getItem('user');
    var name = '';
    try { name = JSON.parse(u).full_name.split(' ')[0]; } catch(e) {}

    var quickActions = userType === 'client'
      ? ['📋 Post a Task', '📊 My Tasks', '📈 My Stats', '🛒 Marketplace']
      : ['🎯 Recommend Tasks', '📊 My Tasks', '📈 My Stats', '💡 How to Apply'];

    addBotMsg(
      '👋 Hey <strong>' + name + '</strong>! I\'m <strong>SkillBot</strong>.<br><br>' +
      (userType === 'client'
        ? 'I can help you <strong>post tasks</strong>, check your task statuses, navigate the platform, and more!'
        : 'I can <strong>recommend the best tasks</strong> for your skills, check your work, guide you on applying, and more!'),
      quickActions
    );
  };

  // ── Send message ──────────────────────────────────────────
  $scope.sendMessage = function() {
    var text = ($scope.inputText || '').trim();
    if (!text || $scope.isTyping) return;

    addUserMsg(text);
    $scope.inputText = '';
    $scope.progress  = null;
    $scope.isTyping  = true;

    var token   = localStorage.getItem('token');
    var endpoint = token ? '/api/chatbot/message' : '/api/chatbot/guest';

    var config = {};
    if (token) {
      config.headers = { 'Authorization': 'Bearer ' + token };
    }

    // Simulate typing delay for realism
    $timeout(function() {
      $http.post(endpoint, { message: text }, config)
        .then(function(res) {
          $scope.isTyping = false;
          var data = res.data;

          addBotMsg(markdownToHtml(data.reply), data.quickActions || []);

          if (data.progress) {
            $scope.progress = data.progress;
          }

          // Auto-navigate if type is navigate
          if (data.type === 'navigate' && data.url) {
            $timeout(function() {
              window.location.hash = data.url.replace('#!', '#!');
              $scope.isOpen = false;
            }, 1500);
          }

          $timeout(function() { scrollToBottom(); }, 80);
        })
        .catch(function(err) {
          $scope.isTyping = false;
          addBotMsg('❌ Oops! Something went wrong. Please try again.', []);
          $timeout(function() { scrollToBottom(); }, 80);
        });
    }, 600); // typing delay
  };

  // ── Quick action click ────────────────────────────────────
  $scope.quickAction = function(action) {
    // Strip emoji and send clean text
    var text = action.replace(/[\u{1F300}-\u{1FFFF}]|[\u2600-\u27BF]/gu, '').trim();
    $scope.inputText = text;
    $scope.sendMessage();
  };

  // ── Enter key to send ─────────────────────────────────────
  $scope.onKeyDown = function($event) {
    if ($event.keyCode === 13 && !$event.shiftKey) {
      $event.preventDefault();
      $scope.sendMessage();
    }
  };

  // ── Clear chat ────────────────────────────────────────────
  $scope.clearChat = function() {
    $scope.messages     = [];
    $scope.quickActions = [];
    $scope.progress     = null;
    $scope.sendWelcome();
  };

  // ── Add messages ──────────────────────────────────────────
  function addUserMsg(text) {
    $scope.messages.push({
      role: 'user',
      html: escapeHtml(text),
      time: getTime()
    });
    $scope.quickActions = [];
    $timeout(function() { scrollToBottom(); }, 40);
  }

  function addBotMsg(html, quickActions) {
    $scope.messages.push({
      role: 'bot',
      html: html,
      time: getTime()
    });
    $scope.quickActions = quickActions || [];
    if (!$scope.isOpen) $scope.hasNewMsg = true;
  }

  // ── Scroll to latest ──────────────────────────────────────
  function scrollToBottom() {
    var el = document.getElementById('chatbot-messages');
    if (el) el.scrollTop = el.scrollHeight;
  }

  // ── Utilities ─────────────────────────────────────────────
  function getTime() {
    var now = new Date();
    return now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');
  }

  function escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // ── Watch for login/logout to reset ──────────────────────
  $scope.$watch(function() {
    return !!localStorage.getItem('token');
  }, function(newVal, oldVal) {
    if (newVal !== oldVal && $scope.messages.length === 0) {
      $scope.sendWelcome();
    }
  });

}]);
