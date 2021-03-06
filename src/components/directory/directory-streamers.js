import { LitElement, html } from "lit-element";

import config from "../../../config";
import "./directory-entry";
import "./directory-streamer-entry";

/**
 * `directory-streamers` handles special logic that needs to be injected into `directory-entry` per streamer.
 *
 * @customElement
 * @polymer
 * @demo
 *
 */
class DirectoryStreamers extends LitElement {
  static get properties() {
    return {
      streamers: { type: Array },
      streamersLive: { type: Array }
    };
  }

  render() {
    const { streamers, streamersLive } = this;
    const hasStreamersLive = streamersLive.length > 0;

    return html`
      <style>
        :host {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          width: 100%;
        }

        h2 {
          width: 100%;
          color: var(--gwn-on-background);
        }

        directory-entry,
        directory-streamer-entry {
          flex-basis: 100%;
          margin-bottom: var(--spacer-medium);
        }

        @media screen and (min-width: 768px) {
          directory-entry,
          directory-streamer-entry {
            flex-basis: calc(100% / 2 - var(--spacer-large) / 2);
            margin-bottom: var(--spacer-large);
          }
        }
      </style>

      ${
        hasStreamersLive
          ? html`
              <h2>Live</h2>
            `
          : ""
      }
      ${
        hasStreamersLive
          ? this._renderStreamerLiveList(streamersLive, streamers)
          : ""
      }
      ${
        hasStreamersLive
          ? html`
              <h2>Directory</h2>
            `
          : ""
      }
      ${this._renderStreamerList(streamers)}
    `;
  }

  constructor() {
    super();

    this.streamers = [];
    this.streamersLive = [];
  }

  updated(changedProps) {
    if (changedProps.get("streamers") && this.streamers.length > 0) {
      const twitchStreamers = this._filterTwitchStreamers(this.streamers);

      this._loadStreamersFromTwitch(twitchStreamers)
        .then(data => {
          console.log(data);
          this.streamersLive = data;
        })
        .catch(error => {
          console.log(error);
        });
    }
  }

  _renderStreamerLiveList(streamersLive, streamers) {
    return html`
      ${
        streamersLive &&
          streamersLive.map(streamer => {
            const streamerInfo = streamers.find(streamerInfo => {
              return (
                streamer.user_name.toLowerCase() ==
                streamerInfo.url.toLowerCase()
              );
            });

            return html`
              <directory-streamer-entry
                name="${streamer.user_name}"
                url="${
                  this._resolvePlatformSpecificUrl({
                    url: streamer.user_name,
                    platform: "twitch"
                  })
                }"
                description="${streamerInfo ? streamerInfo.description : ""}"
                thumbnail="${
                  this._getThumbnailUrlWithSize(
                    streamer.thumbnail_url,
                    514,
                    290
                  )
                }"
              ></directory-streamer-entry>
            `;
          })
      }
    `;
  }

  _renderStreamerList(streamers) {
    return html`
      ${
        streamers &&
          streamers.map(streamer => {
            return html`
              <directory-entry
                name="${streamer.name}"
                url="${this._resolvePlatformSpecificUrl(streamer)}"
                description="${streamer.description}"
                inactive="${streamer.inactive ? true : false}"
              ></directory-entry>
            `;
          })
      }
    `;
  }

  _getThumbnailUrlWithSize(url, width, height) {
    return url.replace("{width}", width).replace("{height}", height);
  }

  _resolvePlatformSpecificUrl({ url, platform }) {
    if (!url) return;

    switch (platform) {
      case "twitch":
        return `https://www.twitch.tv/${url}`;
      default:
        return url;
    }
  }

  _loadStreamersFromTwitch(streamers) {
    if (!streamers) return;

    const streamerUsernameList = streamers.reduce(
      (serialized, streamer, index) => {
        return serialized + "&user_login=" + streamer.url;
      },
      ""
    );

    const options = {
      method: "GET",
      headers: {
        "Client-ID": config.clientId
      }
    };

    return fetch(
      `https://api.twitch.tv/helix/streams?game_id=19357${streamerUsernameList}`,
      options
    )
      .then(response => {
        return response.json();
      })
      .then(json => {
        return json.data;
      })
      .catch(error => {
        console.log(error);
      });
  }

  _filterTwitchStreamers(streamers) {
    return streamers.filter(streamer => streamer.platform == "twitch");
  }
}

customElements.define("directory-streamers", DirectoryStreamers);
