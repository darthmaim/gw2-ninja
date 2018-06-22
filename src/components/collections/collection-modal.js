import { PolymerElement, html } from "@polymer/polymer/polymer-element.js";
import "@polymer/polymer/lib/elements/dom-repeat.js";
import { connect } from 'pwa-helpers/connect-mixin.js';

// Load redux store
import { store } from '../../store.js';

// These are the actions needed by this element.
import { UPDATE_COLLECTION_MODAL } from '../../actions/collections.js';

// Lazy load reducers
import collections from '../../reducers/collections.js';
store.addReducers({
  collections
});

import "../utilities/gwn-modal.js";
import "../utilities/gwn-item-icon.js";
import { SharedStyles } from "../shared-styles.js";

class CollectionModal extends connect(store)(PolymerElement) {
  static get template() {
    return html`
      ${SharedStyles}
      <style>
        :host {
          display: block;
        }

        :host([hidden]) {
          display: none;
        }

        .headline {
          margin-bottom: 0;
          font-weight: bold;
          font-size: 20px;
        }

        .table-scroll {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          border-spacing: 0;
          min-width: 600px;
          table-layout: fixed;
        }

        thead, tfoot {
          display: table;
          width: 100%;
          table-layout: fixed;
          box-shadow: var(--app-box-shadow);
        }

        tfoot {
          box-shadow: var(--app-box-shadow-reverse);
        }

        tbody {
          overflow-y: auto;
          width: 100%;
          max-height: calc(100vh - 1.5rem * 2 - 56px - 45px - 53px);
          display: block;
        }

        tbody tr {
          display: table;
          width: 100%;
          table-layout: fixed;
        }

        td {
          padding: 4px;
          text-overflow: ellipsis;
          overflow: hidden; 
          white-space: nowrap;
        }

        th {
          text-align: left;
          font-size: .9rem;
          font-weight: 800;
          padding: 1rem 4px;
        }

        thead th {
          padding-top: .5rem;
        }

        tr td:first-child, tr th:first-child {
          padding-left: 1rem;
        }

        tr td:last-child, tr th:last-child {
          padding-right: 1rem;
        }

        tr:nth-child(2n) {
          background-color: rgba(0, 0, 0, .04);
        }

        gwn-modal {
          --gwn-modal-width: 800px;
          --gwn-modal-content-padding: 0;
          --gwn-modal-content-overflow-y: none;
        }

        .align-right {
          text-align: right;
        }
        
        .icon {
          width: 32px;
          height: auto;
          margin-right: .5rem;
          vertical-align: middle;
        }

        @media screen and (min-width: 600px) {
          .headline {
            font-size: 24px;
          }
        }
      </style>

      <gwn-modal hidden="[[!open]]" on-hidden-changed="_hiddenChanged">
        <h3 class="headline" slot="title">[[collectionName]]</h3>
        <div slot="content">
          <div class="table-scroll">
            <table cellspacing="0">
              <thead>
                <tr>
                  <th>Item</th>
                  <th class="align-right">Buy Order</th>
                  <th class="align-right">Sell Listing</th>
                </tr>
              </thead>

              <tbody>
                <template is="dom-repeat" items="[[collectionItems]]" initial-count="5" target-framerate="60">
                  <tr>
                    <td>
                      <gwn-item-icon 
                        class="icon" 
                        name="[[item.name]]" 
                        icon="[[item.icon]]" 
                        rarity="[[item.rarity]]"></gwn-item-icon>
                      <span title="[[item.name]]">[[item.name]]</span>
                    </td>
                    <td class="align-right">
                      <gw2-coin-output prepend-zeroes coin-string="[[item.buys.unit_price]]"></gw2-coin-output>
                    </td>
                    <td class="align-right">
                      <gw2-coin-output prepend-zeroes coin-string="[[item.sells.unit_price]]"></gw2-coin-output>
                    </td>
                  </tr>
                </template>
              </tbody>

              <tfoot>
                <tr>
                  <th>Total</th>
                  <th class="align-right">
                    <gw2-coin-output prepend-zeroes coin-string="[[totalBuy]]"></gw2-coin-output>
                  </th>
                  <th class="align-right">
                    <gw2-coin-output prepend-zeroes coin-string="[[totalSell]]"></gw2-coin-output>
                  </th>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </gwn-modal>
    `;
  }

  static get properties() {
    return {
      open: {
        type: Boolean,
        value: false
      },
      collectionName: String,
      collectionItems: String,
      totalBuy: Number,
      totalSell: Number
    };
  }

  _hiddenChanged(e) {
    if (!e) return;

    store.dispatch({
      type: UPDATE_COLLECTION_MODAL,
      collectionModalOpened: !e.detail.value
    });
  }

  // This is called every time something is updated in the store.
  _stateChanged(state) {
    if (!state) return;
    this.set('open', state.collections.collectionModalOpened);
    this.set('collectionName', state.collections.selectedCollection.name);
    this.set('collectionItems', state.collections.selectedCollection.items);
    this.set('totalBuy', state.collections.selectedCollection.totalBuy);
    this.set('totalSell', state.collections.selectedCollection.totalSell);
  }
}

window.customElements.define("collection-modal", CollectionModal);