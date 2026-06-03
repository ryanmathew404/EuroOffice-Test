/*
 *  DocProtection.js (presentationeditor)
 *
 *  FileOpen owner access-restriction controls for the Protection tab.
 *  Presentation editor has no native "Protect Document" feature, so this view
 *  renders ONLY the owner-only buttons (Allow Editing / Allow Printing /
 *  Allow Save Copy). It mirrors the documenteditor implementation.
 *
 *  When the file owner toggles a button, the editor posts a message to the
 *  parent Nextcloud page (fo-fileperms.js relay), which persists the per-file
 *  permissions. Enforcement for non-owners happens server-side.
 */
define([
    'common/main/lib/util/utils',
    'common/main/lib/component/BaseView',
    'common/main/lib/component/Layout'
], function (template) {
    'use strict';

    PE.Views.DocProtection = Common.UI.BaseView.extend(_.extend((function(){
        var template =
            '<div id="fo-owner-group" class="group">' +
            '<span id="slot-btn-allow-edit"     class="btn-slot text x-huge"></span>' +
            '<span id="slot-btn-allow-print"    class="btn-slot text x-huge"></span>' +
            '<span id="slot-btn-allow-download" class="btn-slot text x-huge"></span>' +
            '</div>';

        function setEvents() {
            var me = this;
            if (me._foPerms) {
                function notifyParent() {
                    var msg = {
                        type         : 'fo:savePerms',
                        allowEdit    : me.btnAllowEdit     ? me.btnAllowEdit.pressed     : true,
                        allowPrint   : me.btnAllowPrint    ? me.btnAllowPrint.pressed    : true,
                        allowDownload: me.btnAllowDownload ? me.btnAllowDownload.pressed : true
                    };
                    try { window.parent.postMessage(msg, '*'); } catch(e) {}
                }
                me.btnAllowEdit     && me.btnAllowEdit.on('click',     notifyParent);
                me.btnAllowPrint    && me.btnAllowPrint.on('click',    notifyParent);
                me.btnAllowDownload && me.btnAllowDownload.on('click', notifyParent);
            }
            me._isSetEvents = true;
        }

        return {

            options: {},

            initialize: function (options) {
                Common.UI.BaseView.prototype.initialize.call(this, options);

                this.appConfig = options.mode || {};   // may be constructed without mode for non-owners
                this.lockedControls = [];
                this._state = {disabled: false};

                var foPerms = this.appConfig.customization && this.appConfig.customization.foOwnerPerms;
                if (foPerms && foPerms.isOwner) {
                    this._foPerms = foPerms;

                    this.btnAllowEdit = new Common.UI.Button({
                        cls           : 'btn-toolbar x-huge icon-top',
                        iconCls       : 'toolbar__icon btn-edit',
                        enableToggle  : true,
                        allowDepress  : true,
                        pressed       : foPerms.allowEdit !== false,
                        caption       : this.txtAllowEdit,
                        dataHint      : '1',
                        dataHintDirection: 'bottom',
                        dataHintOffset: 'small'
                    });
                    this.lockedControls.push(this.btnAllowEdit);

                    this.btnAllowPrint = new Common.UI.Button({
                        cls           : 'btn-toolbar x-huge icon-top',
                        iconCls       : 'toolbar__icon btn-print',
                        enableToggle  : true,
                        allowDepress  : true,
                        pressed       : foPerms.allowPrint !== false,
                        caption       : this.txtAllowPrint,
                        dataHint      : '1',
                        dataHintDirection: 'bottom',
                        dataHintOffset: 'small'
                    });
                    this.lockedControls.push(this.btnAllowPrint);

                    this.btnAllowDownload = new Common.UI.Button({
                        cls           : 'btn-toolbar x-huge icon-top',
                        iconCls       : 'toolbar__icon btn-download',
                        enableToggle  : true,
                        allowDepress  : true,
                        pressed       : foPerms.allowDownload !== false,
                        caption       : this.txtAllowDownload,
                        dataHint      : '1',
                        dataHintDirection: 'bottom',
                        dataHintOffset: 'small'
                    });
                    this.lockedControls.push(this.btnAllowDownload);
                }

                Common.UI.LayoutManager.addControls(this.lockedControls);
                Common.NotificationCenter.on('app:ready', this.onAppReady.bind(this));
            },

            render: function (el) {
                return this;
            },

            onAppReady: function (config) {
                var me = this;
                (new Promise(function (accept) { accept(); })).then(function(){
                    setEvents.call(me);
                });
            },

            getPanel: function () {
                this.$el = $(_.template(template)( {} ));
                if (this._foPerms) {
                    this.btnAllowEdit     && this.btnAllowEdit.render(this.$el.filter('#fo-owner-group').find('#slot-btn-allow-edit'));
                    this.btnAllowPrint    && this.btnAllowPrint.render(this.$el.filter('#fo-owner-group').find('#slot-btn-allow-print'));
                    this.btnAllowDownload && this.btnAllowDownload.render(this.$el.filter('#fo-owner-group').find('#slot-btn-allow-download'));
                }
                return this.$el;
            },

            getButtons: function(type) {
                if (type===undefined)
                    return this.lockedControls;
                return [];
            },

            show: function () {
                Common.UI.BaseView.prototype.show.call(this);
                this.fireEvent('show', this);
            },

            txtAllowEdit          : 'Allow Editing',
            txtAllowPrint         : 'Allow Printing',
            txtAllowDownload      : 'Allow Save Copy'
        }
    }()), PE.Views.DocProtection || {}));
});
