import type { Chart, ChartType, Plugin } from 'chart.js';

/** Draw numeric labels on bars / line points without requiring hover. */
export const valueLabelsPlugin: Plugin<ChartType> = {
  id: 'valueLabels',
  afterDatasetsDraw(chart: Chart) {
    const { ctx } = chart;
    ctx.save();
    ctx.font = '600 10px "Google Sans", Arial, sans-serif';
    ctx.textAlign = 'center';

    chart.data.datasets.forEach((dataset, datasetIndex) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      if (meta.hidden) return;

      meta.data.forEach((element, index) => {
        const raw = dataset.data[index];
        if (raw == null) return;
        const value = typeof raw === 'number' ? raw : Number(raw);
        if (!Number.isFinite(value) || value === 0) return;

        const abs = Math.abs(value);
        const label = String(abs);
        const props = element.getProps(['x', 'y', 'base'], true);
        const x = props.x as number;
        const y = props.y as number;
        const base = props.base as number | undefined;

        const isBar = meta.type === 'bar';
        if (isBar) {
          const above = value >= 0;
          ctx.textBaseline = above ? 'bottom' : 'top';
          ctx.fillStyle = '#374151';
          const tipY = above ? Math.min(y, base ?? y) : Math.max(y, base ?? y);
          ctx.fillText(label, x, tipY + (above ? -4 : 4));
        } else {
          ctx.textBaseline = 'bottom';
          ctx.fillStyle = '#1e40af';
          ctx.fillText(label, x, y - 8);
        }
      });
    });

    ctx.restore();
  },
};
