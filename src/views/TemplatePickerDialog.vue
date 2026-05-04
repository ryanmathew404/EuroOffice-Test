<!--
  - SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->
<template>
	<NcDialog class="eurooffice-template-picker-dialog"
		:name="dialogName"
		:buttons="buttons"
		@update:open="$emit('close', false)">
		<ul class="eurooffice-template-container">
			<li v-for="template in items"
				:key="template.id"
				:class="['eurooffice-template-item', { 'eurooffice-template-item--selected': selectedId === template.id }]"
				:tabindex="0"
				@click="selectedId = template.id"
				@keydown.enter.prevent="selectedId = template.id"
				@keydown.space.prevent="selectedId = template.id">
				<img :src="template.icon" :alt="template.name">
				<p>{{ template.name }}</p>
			</li>
		</ul>
	</NcDialog>
</template>

<script>
import NcDialog from '@nextcloud/vue/components/NcDialog'
import { generateUrl } from '@nextcloud/router'
import { t } from '@nextcloud/l10n'

export default {
	name: 'TemplatePickerDialog',

	components: { NcDialog },

	props: {
		fileName: {
			type: String,
			required: true,
		},
		type: {
			type: String,
			required: true,
			validator: v => ['document', 'spreadsheet', 'presentation'].includes(v),
		},
	},

	emits: ['close'],

	data() {
		return {
			selectedId: '0',
			dialogName: t('eurooffice', 'Select template'),
		}
	},

	computed: {
		emptyTemplate() {
			return {
				id: '0',
				name: t('eurooffice', 'Empty'),
				icon: generateUrl('/core/img/filetypes/x-office-{type}.svg', { type: this.type }),
			}
		},
		filteredTemplates() {
			return (OCA.Eurooffice.templates || []).filter(t => t.type === this.type)
		},
		items() {
			return [this.emptyTemplate, ...this.filteredTemplates]
		},
		buttons() {
			return [
				{
					label: t('core', 'Cancel'),
					callback: () => this.$emit('close', false),
				},
				{
					label: t('eurooffice', 'Create'),
					variant: 'primary',
					callback: () => this.create(),
				},
			]
		},
	},

	methods: {
		create() {
			const fileList = OCA.Files.App.fileList
			OCA.Eurooffice.CreateFile(this.fileName, fileList, this.selectedId)
			this.$emit('close', true)
		},
	},
}
</script>

<style scoped lang="scss">
.eurooffice-template-container {
    list-style: none;
    padding: 13px;
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
}

.eurooffice-template-item {
    cursor: pointer;
    width: 120px;
    text-align: center;
    padding: 8px;
    border-radius: var(--border-radius);
    border: 2px solid transparent;
    transition: border-color 0.1s ease, background-color 0.1s ease;

    &:hover {
        background: var(--color-background-hover);
    }

    &--selected {
        border-color: var(--color-primary-element);
        background: var(--color-primary-element-light);
    }

    img {
        width: 64px;
        height: 64px;
        display: block;
        margin: 0 auto;
    }

    p {
        margin: 4px 0 0;
        font-size: 0.9em;
        word-break: break-word;
    }
}

.eurooffice-template-picker-dialog :deep(.modal-container) {
    width: min(560px, 90vw);
}
</style>
