<!--
  - SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->
<template>
	<NcDialog class="eurooffice-download-as-dialog"
		:name="dialogName"
		:buttons="buttons"
		@update:open="$emit('close', false)">
		<div class="eurooffice-download-as">
			<p>{{ promptText }}</p>
			<select v-model="selectedFormat" class="eurooffice-download-as__select">
				<option :value="extension">
					{{ originLabel }}
				</option>
				<option v-for="ext in saveasOptions" :key="ext" :value="ext">
					{{ ext }}
				</option>
			</select>
		</div>
	</NcDialog>
</template>

<script>
import NcDialog from '@nextcloud/vue/components/NcDialog'
import { generateUrl } from '@nextcloud/router'
import { t } from '@nextcloud/l10n'

export default {
	name: 'DownloadAsDialog',

	components: { NcDialog },

	props: {
		fileName: {
			type: String,
			required: true,
		},
		fileId: {
			type: [Number, String],
			required: true,
		},
		extension: {
			type: String,
			required: true,
		},
		saveasOptions: {
			type: Array,
			default: () => [],
		},
	},

	emits: ['close'],

	data() {
		return {
			selectedFormat: this.extension,
			dialogName: t('eurooffice', 'Download as'),
		}
	},

	computed: {
		promptText() {
			return t('eurooffice', 'Choose a format to convert {fileName}', { fileName: this.fileName })
		},
		originLabel() {
			return t('eurooffice', 'Origin format')
		},
		buttons() {
			return [
				{
					label: t('core', 'Cancel'),
					callback: () => this.$emit('close', false),
				},
				{
					label: t('eurooffice', 'Download'),
					variant: 'primary',
					callback: () => this.download(),
				},
			]
		},
	},

	methods: {
		download() {
			const url = generateUrl(
				'apps/eurooffice/downloadas?fileId={fileId}&toExtension={toExtension}',
				{ fileId: this.fileId, toExtension: this.selectedFormat },
			)
			location.href = url
			this.$emit('close', true)
		},
	},
}
</script>

<style scoped lang="scss">
.eurooffice-download-as {
    display: flex;
    flex-direction: column;
    row-gap: 12px;
    padding: 13px;
}

.eurooffice-download-as__select {
    width: 100%;
}

.eurooffice-download-as-dialog :deep(.modal-container) {
    width: 480px;
}
</style>
