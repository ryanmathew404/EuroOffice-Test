/*
 * (c) Copyright Ascensio System SIA 2010-2024
 *
 * This program is a free software product. You can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License (AGPL)
 * version 3 as published by the Free Software Foundation. In accordance with
 * Section 7(a) of the GNU AGPL its Section 15 shall be amended to the effect
 * that Ascensio System SIA expressly excludes the warranty of non-infringement
 * of any third-party rights.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR  PURPOSE. For
 * details, see the GNU AGPL at: http://www.gnu.org/licenses/agpl-3.0.html
 *
 * The  interactive user interfaces in modified source and object code versions
 * of the Program must display Appropriate Legal Notices, as required under
 * Section 5 of the GNU AGPL version 3.
 *
 * All the Product's GUI elements, including illustrations and icon sets, as
 * well as technical writing content are licensed under the terms of the
 * Creative Commons Attribution-ShareAlike 4.0 International. See the License
 * terms at http://creativecommons.org/licenses/by-sa/4.0/legalcode
 *
 */

/**
 *  DocProtection.js
 *
 *  Created on 21.09.2022
 *
 */
define([
    'common/main/lib/util/utils',
    'common/main/lib/component/BaseView',
    'common/main/lib/component/Layout',
    'common/main/lib/component/Window',
    'common/main/lib/view/OpenDialog'
], function (template) {
    'use strict';

    DE.Views.DocProtection = Common.UI.BaseView.extend(_.extend((function(){
        var template =
            '<div class="group">' +
            '<span id="slot-btn-protect-doc" class="btn-slot text x-huge"></span>' +
            '</div>' +
            // Owner-only access restriction controls — shown only when foOwnerPerms.isOwner is true
            '<div id="fo-owner-sep" class="separator long" style="display:none;"></div>' +
            '<div id="fo-owner-group" class="group" style="display:none;">' +
            '<span id="slot-btn-allow-edit"     class="btn-slot text x-huge"></span>' +
            '<span id="slot-btn-allow-print"    class="btn-slot text x-huge"></span>' +
            '<span id="slot-btn-allow-download" class="btn-slot text x-huge"></span>' +
            '</div>';

        function setEvents() {
            var me = this;

            this.btnProtectDoc && this.btnProtectDoc.on('click', function (btn, e) {
                me.fireEvent('protect:document', [btn.pressed]);
            });

            // Owner access restriction buttons — notify parent page via postMessage
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

                this.appConfig = options.mode;

                var _set = Common.enumLock;
                this.lockedControls = [];
                this._state = {disabled: false, currentProtectHint: this.hintProtectDoc };

                // ── Owner-only: file-level access restriction buttons ────────────
                var foPerms = this.appConfig.customization && this.appConfig.customization.foOwnerPerms;

                // "Protect Document" locks the doc for EVERYONE including the owner,
                // so hide it for owners — they use Allow Printing / Allow Save Copy instead.
                if(!this.appConfig.isPDFForm && !(foPerms && foPerms.isOwner)) {
                    this.btnProtectDoc = new Common.UI.Button({
                        cls: 'btn-toolbar x-huge icon-top',
                        iconCls: 'toolbar__icon btn-restrict-editing',
                        enableToggle: true,
                        caption: this.txtProtectDoc,
                        lock        : [_set.lostConnect, _set.coAuth, _set.previewReviewMode, _set.viewFormMode, _set.protectLock, _set.viewMode],
                        dataHint    : '1',
                        dataHintDirection: 'bottom',
                        dataHintOffset: 'small'
                    });
                    this.lockedControls.push(this.btnProtectDoc);
                }
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
                // ── End owner controls ───────────────────────────────────────────

                Common.UI.LayoutManager.addControls(this.lockedControls);
                Common.NotificationCenter.on('app:ready', this.onAppReady.bind(this));
            },

            render: function (el) {
                return this;
            },

            onAppReady: function (config) {
                var me = this;
                (new Promise(function (accept, reject) {
                    accept();
                })).then(function(){
                    me.btnProtectDoc && me.btnProtectDoc.updateHint(me._state.currentProtectHint, true);
                    setEvents.call(me);
                });
            },

            getPanel: function () {
                this.$el = $(_.template(template)( {} ));

                if (this._foPerms) {
                    // Owner view: hide "Protect Document" group, show only owner controls.
                    // NOTE: the template yields multiple sibling root nodes, so #fo-owner-group
                    // is a ROOT of this.$el — jQuery .find() only matches descendants and would
                    // miss it. Use .filter() to target the root element itself.
                    this.$el.find('#slot-btn-protect-doc').closest('.group').hide();
                    this.$el.filter('#fo-owner-group').show();
                    this.btnAllowEdit     && this.btnAllowEdit.render(this.$el.find('#slot-btn-allow-edit'));
                    this.btnAllowPrint    && this.btnAllowPrint.render(this.$el.find('#slot-btn-allow-print'));
                    this.btnAllowDownload && this.btnAllowDownload.render(this.$el.find('#slot-btn-allow-download'));
                } else {
                    // Non-owner / non-foPerms: show "Protect Document" as normal
                    this.btnProtectDoc && this.btnProtectDoc.render(this.$el.find('#slot-btn-protect-doc'));
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

            updateProtectionTips: function(type) {
                var str = this.txtProtectDoc;
                if (type === Asc.c_oAscEDocProtect.ReadOnly) {
                    str = this.txtDocProtectedView;
                } else if (type === Asc.c_oAscEDocProtect.Comments) {
                    str = this.txtDocProtectedComment;
                } else if (type === Asc.c_oAscEDocProtect.Forms) {
                    str = this.txtDocProtectedForms;
                } else if (type === Asc.c_oAscEDocProtect.TrackedChanges){ // none or tracked changes
                    str = this.txtDocProtectedTrack;
                }
                this.btnProtectDoc && this.btnProtectDoc.updateHint(str, true);
                this._state.currentProtectHint = str;
            },
            txtProtectDoc         : 'Protect Document',
            txtAllowEdit          : 'Allow Editing',
            txtAllowPrint         : 'Allow Printing',
            txtAllowDownload      : 'Allow Save Copy',
            txtDocProtectedView   : 'Document is protected.<br>You may only view this document.',
            txtDocProtectedTrack  : 'Document is protected.<br>You may edit this document, but all changes will be tracked.',
            txtDocProtectedComment: 'Document is protected.<br>You may only insert comments to this document.',
            txtDocProtectedForms  : 'Document is protected.<br>You may only fill in forms in this document.',
            hintProtectDoc        : 'Protect document',
            txtDocUnlockDescription: 'Enter a password to unprotect document',
            txtUnlockTitle        : 'Unprotect Document'
        }
    }()), DE.Views.DocProtection || {}));
});
