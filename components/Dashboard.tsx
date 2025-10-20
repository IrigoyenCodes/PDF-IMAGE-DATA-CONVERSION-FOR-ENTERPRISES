import React, { useMemo } from 'react';
import type { AnyProcessedDocument, WorkOrderDocument } from '../types';
import { ChartPieIcon, ChartBarIcon } from './Icons';

interface DashboardProps {
  data: AnyProcessedDocument[];
}

const StatCard: React.FC<{ title: string; value: number | string; className?: string }> = ({ title, value, className }) => (
  <div className={`p-4 bg-white rounded-lg shadow border-l-4 ${className}`}>
    <p className="text-sm text-gray-500">{title}</p>
    <p className="text-2xl font-bold text-udlap-green">{value}</p>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const stats = useMemo(() => {
    const successfulDocs = data.filter(d => d.orden !== 'Fallo de Procesamiento');
    const workOrders = successfulDocs.filter((d): d is WorkOrderDocument => d.type === 'workOrder');
    const supplyRequests = successfulDocs.filter(d => d.type === 'supplyRequest');
    const uninstallations = successfulDocs.filter(d => d.type === 'uninstallation');
    const installations = successfulDocs.filter(d => d.type === 'installation');
    const failedDocs = data.filter(d => d.orden === 'Fallo de Procesamiento');

    const categories = workOrders.reduce((acc, doc) => {
      const category = ((doc.categoria || '').trim() || 'Sin Categoría').toUpperCase();
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sortedCategories = Object.entries(categories).sort(([, a], [, b]) => b - a);
    const maxCategoryCount = sortedCategories.length > 0 ? sortedCategories[0][1] : 0;

    const totalSuccess = successfulDocs.length;
    const pcts = {
        wo: totalSuccess > 0 ? (workOrders.length / totalSuccess) * 100 : 0,
        sr: totalSuccess > 0 ? (supplyRequests.length / totalSuccess) * 100 : 0,
        un: totalSuccess > 0 ? (uninstallations.length / totalSuccess) * 100 : 0,
        in: totalSuccess > 0 ? (installations.length / totalSuccess) * 100 : 0,
    };
    
    const conicGradient = `conic-gradient(
        #005130 0% ${pcts.wo}%, 
        #f47b20 ${pcts.wo}% ${pcts.wo + pcts.sr}%,
        #64748b ${pcts.wo + pcts.sr}% ${pcts.wo + pcts.sr + pcts.un}%,
        #38bdf8 ${pcts.wo + pcts.sr + pcts.un}% 100%
    )`;


    return {
      total: data.length,
      successful: successfulDocs.length,
      workOrders: workOrders.length,
      supplyRequests: supplyRequests.length,
      uninstallations: uninstallations.length,
      installations: installations.length,
      failed: failedDocs.length,
      categories: sortedCategories,
      maxCategoryCount,
      conicGradient,
    };
  }, [data]);

  if (stats.total === 0) {
      return null;
  }
  
  return (
    <div className="mt-6 animate-fade-in">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <StatCard title="Total" value={stats.total} className="border-gray-400" />
            <StatCard title="Órdenes Trab." value={stats.workOrders} className="border-udlap-green" />
            <StatCard title="Pedidos Sum." value={stats.supplyRequests} className="border-udlap-orange" />
            <StatCard title="Desinstal." value={stats.uninstallations} className="border-slate-500" />
            <StatCard title="Instal." value={stats.installations} className="border-sky-500" />
            <StatCard title="Fallidos" value={stats.failed} className="border-red-500" />
        </div>

        {stats.successful > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-4 bg-white rounded-lg shadow">
                    <h3 className="font-semibold text-udlap-green flex items-center mb-4"><ChartPieIcon /> <span className="ml-2">Desglose de Documentos</span></h3>
                    <div className="flex items-center justify-center space-x-6 py-4">
                         <div
                            className="w-24 h-24 rounded-full"
                            style={{ background: stats.conicGradient }}
                            role="img"
                            aria-label={`Pie chart showing document breakdown.`}
                        ></div>
                        <div className="text-sm space-y-2">
                            <div className="flex items-center">
                                <span className="w-3 h-3 rounded-full bg-udlap-green mr-2"></span>
                                <span className="text-gray-700">Órdenes de Trabajo: <strong>{stats.workOrders}</strong></span>
                            </div>
                            <div className="flex items-center">
                                <span className="w-3 h-3 rounded-full bg-udlap-orange mr-2"></span>
                                <span className="text-gray-700">Pedidos de Suministros: <strong>{stats.supplyRequests}</strong></span>
                            </div>
                             <div className="flex items-center">
                                <span className="w-3 h-3 rounded-full bg-slate-500 mr-2"></span>
                                <span className="text-gray-700">Desinstalaciones: <strong>{stats.uninstallations}</strong></span>
                            </div>
                             <div className="flex items-center">
                                <span className="w-3 h-3 rounded-full bg-sky-500 mr-2"></span>
                                <span className="text-gray-700">Instalaciones: <strong>{stats.installations}</strong></span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-white rounded-lg shadow">
                    <h3 className="font-semibold text-udlap-green flex items-center mb-4"><ChartBarIcon /> <span className="ml-2">Categorías de Órdenes de Trabajo</span></h3>
                    <div className="space-y-3">
                        {stats.categories.length > 0 ? stats.categories.map(([category, count]) => (
                            <div key={category} className="grid grid-cols-12 items-center text-sm gap-2">
                                <span className="truncate col-span-8 md:col-span-7 text-gray-700" title={category}>{category}</span>
                                <div className="col-span-3 md:col-span-4 bg-gray-200 rounded-full h-4">
                                    <div 
                                        className="bg-udlap-green h-4 rounded-full"
                                        style={{ width: `${(count / stats.maxCategoryCount) * 100}%` }}
                                    >
                                    </div>
                                </div>
                                <span className="col-span-1 text-right font-bold text-udlap-green">{count}</span>
                            </div>
                        )) : <p className="text-sm text-gray-500">No hay datos de categorías para mostrar.</p>}
                    </div>
                </div>
            </div>
        )}
         <style>{`
            @keyframes fade-in {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in {
                animation: fade-in 0.5s ease-out forwards;
            }
        `}</style>
    </div>
  );
};

export default Dashboard;