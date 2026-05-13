ALTER TABLE `rangeCharts`
  ADD COLUMN `sourceStatus` enum(
    'source_backed',
    'imported_unreviewed',
    'generated_candidate',
    'proxy',
    'simplified_population',
    'unsupported'
  ) DEFAULT NULL AFTER `sourceLabel`,
  ADD COLUMN `sourceFile` varchar(255) DEFAULT NULL AFTER `sourceStatus`,
  ADD COLUMN `sourcePanelLabel` varchar(255) DEFAULT NULL AFTER `sourceFile`,
  ADD COLUMN `dataVersion` varchar(64) DEFAULT NULL AFTER `sourcePanelLabel`,
  ADD COLUMN `reviewedBy` varchar(255) DEFAULT NULL AFTER `dataVersion`,
  ADD COLUMN `reviewedAt` varchar(32) DEFAULT NULL AFTER `reviewedBy`;
