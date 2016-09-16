/* global $, followedChannels, clientID */
;(function () {
  'use strict'

  var minutes = 60 * 1000
  var strings = {
    'live': 'Live now!',
    'viewers': 'Watching now',
    'new': 'Just started streaming!',
    'recent': 'Recently started streaming!',
    'playing': 'streaming',
    'nonelive': 'Nobody is streaming right now.',
    'topstreams': 'Instead, here are some of the most popular streams right now:'
  }

  /**
   * Renders a Twitch API stream object as an HTML element.
   * @param {Object} stream A Twitch API stream object.
   */
  function renderStream (stream) {
    var isFucked = !stream.channel.hasOwnProperty('status')
    var url = stream.channel.url || 'http://www.twitch.tv/' + stream.channel.name
    var startDate = new Date(stream.created_at)
    var timeLive = Date.now() - startDate.getTime()
    var $div = $('<div>', { 'class': 'live transparent twitch stream' })
    var $status = $('<a>', {
      'href': url,
      'title': stream.channel.status
    })
    var $icon = $('<i>', {
      'class': 'twitch icon',
      'title': strings.live
    })
    var $name = $('<strong>', {
      'text': stream.channel.display_name
    })
    var $game = $('<strong>', {
      'text': stream.game
    })
    var $title = $('<em>', {
      'text': stream.channel.status
    })
    var $viewers = $('<span>', {
      'class': 'viewers',
      'title': strings.viewers,
      'text': parseInt(stream.viewers, 10).toLocaleString()
    })

    // Add some flavor (e.g. for recently started streams)
    if (timeLive < (15 * minutes)) {
      $icon = $('<i>', {
        'class': 'yellow asterisk icon',
        'title': strings.new
      })
    } else if (timeLive < (30 * minutes)) {
      $icon = $('<i>', {
        'class': 'asterisk icon',
        'title': strings.recent
      })
    }

    $status.append($icon)
    $status.append($name)
    if (stream.game) {
      $status.append(' ' + strings.playing + ' ')
      $status.append($game)
    }
    if (!isFucked) {
      $status.append(': ')
      $status.append($title)
    }

    $status.appendTo($div)
    $viewers.appendTo($div)

    return $div
  }

  function getJSON (url, callback) {
    $.ajax({
      url: url,
      type: 'GET',
      dataType: 'jsonp',
      headers: { 'Client-ID': clientID },
      success: callback
    })
  }

  /**
   * Starts the "live on Twitch" update cycle.
   * @param {Array} [channels] A string array containing the names of Twitch
   *        channels to display.
   * @param {Number} [interval=60000] The interval between status update
   *        calls in milliseconds.
   * @param {Boolean} [suggest=true] A value indicating whether to suggest top
   *        streams if no followed channels are live.
   * @returns {Number} A numerical id which can be used later with
   *          `clearInterval`.
   */
  function beginUpdateStreams (channels, interval, suggest) {
    interval = interval || 60000

    function update () {
      var url = 'https://api.twitch.tv/kraken/streams/' +
        '?channel=' + channels.join() +
        '&callback=?' // Fuck browsers.

      $('#home-twitch-updating').show()
      getJSON(url, function (data) {
        $('#home-twitch-updating').hide()

        var $twitch = $('#twitch')
        $twitch.empty()

        if (data.streams && data.streams.length > 0) {
          $.each(data.streams, function (index, stream) {
            var $stream = renderStream(stream)
            $twitch.append($stream)
          })
        } else {
          var $msgNoStreams = $('<p>', { text: strings.nonelive })
          $twitch.append($msgNoStreams)

          if (suggest) {
            var url = 'https://api.twitch.tv/kraken/streams' +
              '?limit=8&callback=?'
            getJSON(url, function (data) {
              if (data.streams && data.streams.length > 0) {
                var $msgSuggest = $('<p>', { text: strings.topstreams })

                $twitch.append($msgSuggest)
                $.each(data.streams, function (index, stream) {
                  var $stream = renderStream(stream)
                  $twitch.append($stream)
                })
              }
            })
          }
        }
      })
    }

    update()
    return window.setInterval(update, interval)
  }

  beginUpdateStreams(followedChannels)
}())
