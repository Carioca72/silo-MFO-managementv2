import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { DetailedAsset, ProjectionResult } from '../../services/analysis/financialEngine';
import { Diagnosis } from '../../services/analysis/diagnosisEngine';

// Register fonts if needed, using standard fonts for now
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyC0IT4ttDfA.ttf' }, // Example URL, usually local
    { src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyC0IT4ttDfA.ttf', fontWeight: 'bold' }
  ]
});

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Helvetica'
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 10
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827'
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 5
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#4F46E5'
  },
  text: {
    fontSize: 10,
    marginBottom: 5,
    lineHeight: 1.5
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderColor: '#E5E7EB',
    marginTop: 10
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row'
  },
  tableCol: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: '#E5E7EB'
  },
  tableCell: {
    margin: 'auto',
    marginTop: 5,
    fontSize: 8,
    padding: 5
  },
  alertBox: {
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444'
  },
  alertTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#B91C1C',
    marginBottom: 5
  },
  alertText: {
    fontSize: 10,
    color: '#7F1D1D'
  }
});

interface SiloReportProps {
  clientName: string;
  currentAssets: DetailedAsset[];
  suggestedAssets: DetailedAsset[];
  diagnoses: Diagnosis[];
  currentProjection: ProjectionResult;
  suggestedProjection: ProjectionResult;
}

export const SiloReportPDF: React.FC<SiloReportProps> = ({
  clientName,
  currentAssets,
  suggestedAssets,
  diagnoses,
  currentProjection,
  suggestedProjection
}) => (
  <Document>
    {/* Page 1: Diagnosis */}
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Relatório de Diagnóstico</Text>
        <Text style={styles.subtitle}>Cliente: {clientName}</Text>
        <Text style={styles.subtitle}>Data: {new Date().toLocaleDateString()}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Considerações Iniciais</Text>
        {diagnoses.length > 0 ? (
          diagnoses.map((d, i) => (
            <View key={i} style={styles.alertBox}>
              <Text style={styles.alertTitle}>{d.rule}</Text>
              <Text style={styles.alertText}>{d.message}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.text}>Nenhuma inconsistência crítica detectada na carteira atual.</Text>
        )}
      </View>
      
      {/* Placeholder for Pie Chart - react-pdf doesn't support charts directly easily without image gen */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Alocação Atual</Text>
        <Text style={styles.text}>[Gráfico de Alocação]</Text>
        {/* List top allocations */}
        {currentAssets.slice(0, 5).map((a, i) => (
            <Text key={i} style={styles.text}>• {a.ticker}: {(a.pct * 100).toFixed(1)}%</Text>
        ))}
      </View>
    </Page>

    {/* Page 2: Suggested Portfolio */}
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Carteira Sugerida</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nova Composição</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={{ ...styles.tableCol, width: '20%' }}><Text style={styles.tableCell}>Ativo</Text></View>
            <View style={{ ...styles.tableCol, width: '20%' }}><Text style={styles.tableCell}>Classe</Text></View>
            <View style={{ ...styles.tableCol, width: '20%' }}><Text style={styles.tableCell}>Estratégia</Text></View>
            <View style={{ ...styles.tableCol, width: '20%' }}><Text style={styles.tableCell}>Valor</Text></View>
            <View style={{ ...styles.tableCol, width: '20%' }}><Text style={styles.tableCell}>%</Text></View>
          </View>
          {suggestedAssets.map((asset, i) => (
            <View key={i} style={styles.tableRow}>
              <View style={{ ...styles.tableCol, width: '20%' }}><Text style={styles.tableCell}>{asset.ticker}</Text></View>
              <View style={{ ...styles.tableCol, width: '20%' }}><Text style={styles.tableCell}>{asset.class}</Text></View>
              <View style={{ ...styles.tableCol, width: '20%' }}><Text style={styles.tableCell}>{asset.strategy}</Text></View>
              <View style={{ ...styles.tableCol, width: '20%' }}><Text style={styles.tableCell}>R$ {asset.value.toFixed(2)}</Text></View>
              <View style={{ ...styles.tableCol, width: '20%' }}><Text style={styles.tableCell}>{(asset.pct * 100).toFixed(1)}%</Text></View>
            </View>
          ))}
        </View>
      </View>
    </Page>

    {/* Page 3: Performance */}
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Performance Comparativa</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Indicadores Consolidados (12 Meses)</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={{ ...styles.tableCol, width: '40%' }}><Text style={styles.tableCell}>Indicador</Text></View>
            <View style={{ ...styles.tableCol, width: '30%' }}><Text style={styles.tableCell}>Carteira Atual</Text></View>
            <View style={{ ...styles.tableCol, width: '30%' }}><Text style={styles.tableCell}>Novo Cenário</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={{ ...styles.tableCol, width: '40%' }}><Text style={styles.tableCell}>Retorno Líquido Total</Text></View>
            <View style={{ ...styles.tableCol, width: '30%' }}><Text style={styles.tableCell}>R$ {currentProjection.aggregated.totalNetReturn.toFixed(2)}</Text></View>
            <View style={{ ...styles.tableCol, width: '30%' }}><Text style={styles.tableCell}>R$ {suggestedProjection.aggregated.totalNetReturn.toFixed(2)}</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={{ ...styles.tableCol, width: '40%' }}><Text style={styles.tableCell}>Retorno %</Text></View>
            <View style={{ ...styles.tableCol, width: '30%' }}><Text style={styles.tableCell}>{(currentProjection.aggregated.returnPct * 100).toFixed(2)}%</Text></View>
            <View style={{ ...styles.tableCol, width: '30%' }}><Text style={styles.tableCell}>{(suggestedProjection.aggregated.returnPct * 100).toFixed(2)}%</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={{ ...styles.tableCol, width: '40%' }}><Text style={styles.tableCell}>Sharpe Ratio</Text></View>
            <View style={{ ...styles.tableCol, width: '30%' }}><Text style={styles.tableCell}>{currentProjection.aggregated.sharpeRatio.toFixed(2)}</Text></View>
            <View style={{ ...styles.tableCol, width: '30%' }}><Text style={styles.tableCell}>{suggestedProjection.aggregated.sharpeRatio.toFixed(2)}</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={{ ...styles.tableCol, width: '40%' }}><Text style={styles.tableCell}>Volatilidade</Text></View>
            <View style={{ ...styles.tableCol, width: '30%' }}><Text style={styles.tableCell}>{(currentProjection.aggregated.volatility * 100).toFixed(2)}%</Text></View>
            <View style={{ ...styles.tableCol, width: '30%' }}><Text style={styles.tableCell}>{(suggestedProjection.aggregated.volatility * 100).toFixed(2)}%</Text></View>
          </View>
        </View>
      </View>
    </Page>
  </Document>
);
