<?php
/**
 * FileOpen Systems — per-file access restrictions
 */

declare(strict_types=1);

namespace OCA\Eurooffice\Migration;

use Closure;
use OCP\DB\ISchemaWrapper;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;

class Version080000Date20260528000000 extends SimpleMigrationStep {

    public function preSchemaChange(IOutput $output, Closure $schemaClosure, array $options): void {}

    public function changeSchema(IOutput $output, Closure $schemaClosure, array $options): ?ISchemaWrapper {
        /** @var ISchemaWrapper $schema */
        $schema = $schemaClosure();

        if (!$schema->hasTable('eurooffice_file_permissions')) {
            $table = $schema->createTable('eurooffice_file_permissions');
            $table->addColumn('id', 'integer', [
                'autoincrement' => true,
                'notnull' => true,
            ]);
            $table->addColumn('file_id', 'bigint', [
                'notnull' => true,
            ]);
            $table->addColumn('allow_print', 'smallint', [
                'notnull' => true,
                'default' => 1,
            ]);
            $table->addColumn('allow_download', 'smallint', [
                'notnull' => true,
                'default' => 1,
            ]);
            $table->addColumn('allow_edit', 'smallint', [
                'notnull' => true,
                'default' => 1,
            ]);
            $table->setPrimaryKey(['id']);
            $table->addUniqueIndex(['file_id'], 'eo_file_perms_file_id');
        }

        return $schema;
    }

    public function postSchemaChange(IOutput $output, Closure $schemaClosure, array $options): void {}
}
