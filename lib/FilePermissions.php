<?php
/**
 * FileOpen Systems — per-file access restrictions
 */

namespace OCA\Eurooffice;

use OCP\IDBConnection;
use Psr\Log\LoggerInterface;

/**
 * Stores and retrieves file-level access restrictions set by the file owner.
 * These restrictions layer on top of Nextcloud share permissions.
 */
class FilePermissions {

    private const TABLENAME = 'eurooffice_file_permissions';

    public function __construct(
        private readonly IDBConnection $connection,
        private readonly LoggerInterface $logger,
    ) {}

    /**
     * Return the access restrictions for a file.
     * Defaults to fully permissive if no row exists.
     *
     * @param int $fileId Nextcloud file ID
     * @return array{allowPrint: bool, allowDownload: bool, allowEdit: bool}
     */
    public function get(int $fileId): array {
        $qb = $this->connection->getQueryBuilder();
        $qb->select('allow_print', 'allow_download', 'allow_edit')
            ->from(self::TABLENAME)
            ->where($qb->expr()->eq('file_id', $qb->createNamedParameter($fileId)));

        $result = $qb->executeQuery();
        $row = $result->fetch();
        $result->closeCursor();

        if ($row) {
            return [
                'allowPrint'    => (bool)(int)$row['allow_print'],
                'allowDownload' => (bool)(int)$row['allow_download'],
                'allowEdit'     => (bool)(int)$row['allow_edit'],
            ];
        }

        return ['allowPrint' => true, 'allowDownload' => true, 'allowEdit' => true];
    }

    /**
     * Persist access restrictions for a file (upsert).
     *
     * @param int  $fileId
     * @param bool $allowPrint
     * @param bool $allowDownload
     * @param bool $allowDownload
     * @return bool
     */
    public function set(int $fileId, bool $allowPrint, bool $allowDownload, bool $allowEdit): bool {
        try {
            if ($this->exists($fileId)) {
                $qb = $this->connection->getQueryBuilder();
                $qb->update(self::TABLENAME)
                    ->set('allow_print',    $qb->createNamedParameter($allowPrint    ? 1 : 0))
                    ->set('allow_download', $qb->createNamedParameter($allowDownload ? 1 : 0))
                    ->set('allow_edit',     $qb->createNamedParameter($allowEdit     ? 1 : 0))
                    ->where($qb->expr()->eq('file_id', $qb->createNamedParameter($fileId)));
                return (bool)$qb->executeStatement();
            } else {
                $qb = $this->connection->getQueryBuilder();
                $qb->insert(self::TABLENAME)
                    ->values([
                        'file_id'       => $qb->createNamedParameter($fileId),
                        'allow_print'   => $qb->createNamedParameter($allowPrint    ? 1 : 0),
                        'allow_download'=> $qb->createNamedParameter($allowDownload ? 1 : 0),
                        'allow_edit'    => $qb->createNamedParameter($allowEdit     ? 1 : 0),
                    ]);
                return (bool)$qb->executeStatement();
            }
        } catch (\Exception $e) {
            $this->logger->error('FilePermissions::set failed for fileId ' . $fileId, ['exception' => $e]);
            return false;
        }
    }

    private function exists(int $fileId): bool {
        $qb = $this->connection->getQueryBuilder();
        $qb->select('id')
            ->from(self::TABLENAME)
            ->where($qb->expr()->eq('file_id', $qb->createNamedParameter($fileId)));

        $result = $qb->executeQuery();
        $row = $result->fetch();
        $result->closeCursor();

        return (bool)$row;
    }
}
