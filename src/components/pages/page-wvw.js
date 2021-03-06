import { PolymerElement, html } from "@polymer/polymer/polymer-element.js";
import { connect } from "pwa-helpers/connect-mixin.js";
import { afterNextRender } from "@polymer/polymer/lib/utils/render-status.js";
import "@polymer/polymer/lib/elements/dom-repeat.js";

// Load redux store
import { store } from "../../store.js";

// Lazy load reducers
import settings from "../../reducers/settings.js";
import account from "../../reducers/account.js";
store.addReducers({
  settings,
  account
});

import "@polymer/app-route/app-location.js";
import "@polymer/app-route/app-route.js";
import "@polymer/iron-pages/iron-pages.js";
import "@polymer/paper-tabs/paper-tabs.js";
import "@polymer/paper-dropdown-menu/paper-dropdown-menu.js";
import "@polymer/paper-listbox/paper-listbox.js";
import "@polymer/paper-item/paper-item.js";

import { SharedStyles } from "../shared-styles.js";

import { getMatches } from "../utilities/gwn-wvw-utils";
import { getWorlds } from "../utilities/gwn-misc-utils";

import "../wvw/wvw-map";
import "../wvw/wvw-map-stats";
import "../wvw/wvw-region";
import "../wvw/wvw-matchup";
import "../wvw/wvw-leaderboards";

/**
 * `page-wvw`
 *
 * @summary
 * @customElement
 * @extends {Polymer.Element}
 */
class PageWvw extends connect(store)(PolymerElement) {
  static get properties() {
    return {
      subviewData: Object,
      mapActive: {
        type: Boolean,
        computed: "_checkActiveMap(subviewData)"
      },
      matches: Array,
      worlds: Array,
      serverId: {
        type: Number,
        value: null
      },
      currentMatch: Object,
      objectives: Array,
      selectedObjective: Object,
      matchesInterval: Object
    };
  }

  static get template() {
    return html`
      ${SharedStyles}
      <style>
        :host {
          position: relative;
        }

        .sticky-tabs {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          background-color: var(--gwn-primary);
        }

        paper-dropdown-menu {
          width: 100%;
          padding: 0 var(--spacer-large);
          --iron-icon-fill-color: var(--gwn-text-light);
          --paper-input-container-color: var(--gwn-text-light);
          --paper-input-container-focus-color: var(--gwn-text-light);
          --paper-input-container-input: {
            color: var(--gwn-text-light);
          }
          --paper-input-container-label: {
            color: var(--gwn-text-light);
          }
          --paper-font-caption: {
            font-family: var(--gwn-font-stack);
          }
          --paper-input-container-shared-input-style: {
            font-family: var(--gwn-font-stack);
          }
          --paper-font-subhead: {
            font-family: var(--gwn-font-stack);
          }
        }

        paper-tabs {
          width: 100%;
          flex: auto;
          --paper-tabs-selection-bar-color: var(--gwn-on-primary);
        }

        paper-tab {
          font-family: var(--gwn-font-stack);
          color: white;
        }

        paper-tab.iron-selected,
        paper-tab[focused] {
          font-weight: 700;
        }

        paper-tab span {
          display: none;
        }

        .map {
          height: calc(100vh - 11.25rem);
          position: relative;
        }

        wvw-map {
          height: 100%;
          width: 100%;
        }

        wvw-map-stats {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          max-height: calc(100vh - 11.25rem);
          overflow: auto;
        }

        .error-msg {
          color: var(--gwn-on-background);
          margin: var(--spacer-medium);
          font-weight: 600;
        }

        @media screen and (min-width: 768px) {
          .sticky-tabs {
            flex-direction: row;
            padding: 0 var(--spacer-large);
          }

          paper-dropdown-menu {
            padding: 0;
            width: auto;
            flex: none;
            margin-right: var(--spacer-large);
          }

          paper-tabs {
            width: auto;
          }

          paper-tab span {
            display: inline;
          }

          .map {
            height: calc(100vh - 8.25rem);
          }

          wvw-map-stats {
            max-height: calc(100vh - 8.25rem);
          }
        }
      </style>

      <app-location route="{{route}}"></app-location>
      <app-route
        route="{{route}}"
        pattern="/wvw/:subview"
        data="{{subviewData}}"
      ></app-route>

      <div class="sticky-tabs">
        <paper-dropdown-menu label="Select World">
          <paper-listbox
            slot="dropdown-content"
            selected="{{serverId}}"
            class="dropdown-content"
            attr-for-selected="value"
          >
            <template is="dom-repeat" items="[[worlds]]" as="world">
              <paper-item value="[[world.id]]">[[world.name]]</paper-item>
            </template>
          </paper-listbox>
        </paper-dropdown-menu>

        <paper-tabs selected="{{subviewData.subview}}" attr-for-selected="name">
          <paper-tab name="overview"
            >Region<span>&nbsp;Overview</span></paper-tab
          >
          <paper-tab name="map"><span>Live&nbsp;</span>Map</paper-tab>
          <paper-tab name="stats">Matchup<span>&nbsp;Stats</span></paper-tab>
          <paper-tab name="leaderboards">Leaderboards</paper-tab>
        </paper-tabs>
      </div>

      <iron-pages
        selected="{{ subviewData.subview }}"
        attr-for-selected="name"
        fallback-selection="map"
      >
        <div name="map" class="map">
          <div class="error-msg text-center" hidden$="[[serverId]]">
            Please select a server in the dropdown above.
          </div>
          <wvw-map-stats
            hidden$="[[!serverId]]"
            selected-objective="[[ selectedObjective ]]"
            on-objective-close="_objectiveClose"
          ></wvw-map-stats>
          <wvw-map
            hidden$="[[!serverId]]"
            map-data="[[ currentMatchup.maps ]]"
            active="[[ mapActive ]]"
            added-objectives="{{ objectives }}"
            on-objective-clicked="_objectiveClicked"
          ></wvw-map>
        </div>
        <div name="overview">
          <wvw-region
            matches="[[ matches ]]"
            worlds="[[ worlds ]]"
            own-world="[[serverId]]"
          ></wvw-region>
        </div>
        <div name="stats">
          <div class="error-msg text-center" hidden$="[[serverId]]">
            Please select a server in the dropdown above.
          </div>
          <wvw-matchup
            matchup="[[ currentMatchup ]]"
            worlds="[[ worlds ]]"
            hidden$="[[!serverId]]"
          ></wvw-matchup>
        </div>
        <div name="leaderboards">
          <wvw-leaderboards
            matches="[[ matches ]]"
            worlds="[[ worlds ]]"
            own-world="[[serverId]]"
          ></wvw-leaderboards>
        </div>
      </iron-pages>
    `;
  }

  static get observers() {
    return ["_selectedServerChanged(serverId, matches)"];
  }

  ready() {
    super.ready();

    afterNextRender(this, function() {
      const that = this;

      getMatches().then(matches => this.set("matches", matches));
      setInterval(() => {
        getMatches().then(matches => that.set("matches", matches));
      }, 10000);
    });
  }

  _selectedServerChanged(serverId, matches) {
    if (!serverId || !matches) return;

    const foundMatchup = matches.filter(match =>
      match.all_worlds.blue.includes(serverId) ||
      match.all_worlds.red.includes(serverId) ||
      match.all_worlds.green.includes(serverId)
        ? true
        : false
    )[0];

    if (!foundMatchup)
      return console.log("No matchup was found for the server provided.");

    this.set("currentMatchup", foundMatchup);
  }

  _checkActiveMap(route) {
    return route.subview == "map" ? true : false;
  }

  _objectiveClicked(e) {
    const mapStatus = this.currentMatchup.maps;
    const foundObjective = this._resolveObjectiveById(e.detail.objectiveId);
    const mapContainingObjective = mapStatus.find(
      map => map.type == foundObjective.map_type
    );
    const objectiveStatus = mapContainingObjective.objectives.find(
      objective => objective.id == foundObjective.id
    );
    const selectedObjective = Object.assign(
      {},
      foundObjective,
      objectiveStatus
    );
    this.set("selectedObjective", selectedObjective);
  }

  _objectiveClose(e) {
    this.set("selectedObjective", null);
  }

  _resolveObjectiveById(id) {
    if (!id) return;
    const objectives = this.objectives || [];
    return objectives.find(objective => objective.id === id);
  }

  _stateChanged({ settings, account }) {
    if (!settings.language) {
      getWorlds().then(worlds => this.set("worlds", worlds));
    } else {
      getWorlds(settings.language).then(worlds => this.set("worlds", worlds));
    }

    if (!account.world) return;
    this.set("serverId", account.world);
  }
}

window.customElements.define("page-wvw", PageWvw);
