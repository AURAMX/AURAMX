import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { AlertTriangle, RefreshCw } from 'lucide-react-native';

const GOLD = '#D4AF37';
const BG_COLOR = '#0B0F1A';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  loading?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Production-Grade Global Error Boundary & Safe UI Wrapper
 */
class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[SafeView Boundary]', error, errorInfo);
  }

  private resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <View style={styles.errorContainer}>
          <AlertTriangle color="#FF5252" size={48} />
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>
            {this.state.error?.message || 'A critical rendering error occurred.'}
          </Text>
          <Pressable style={styles.retryBtn} onPress={this.resetError}>
            <RefreshCw color="#000" size={20} />
            <Text style={styles.retryText}>Reload Component</Text>
          </Pressable>
        </View>
      );
    }

    if (this.props.loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator color={GOLD} size="large" />
                <Text style={styles.loadingText}>Syncing securely...</Text>
            </View>
        );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: BG_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30
  },
  errorTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 20 },
  errorText: { color: '#8A8D93', textAlign: 'center', marginTop: 10, marginBottom: 30 },
  retryBtn: { 
    flexDirection: 'row', 
    backgroundColor: GOLD, 
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    borderRadius: 8, 
    alignItems: 'center',
    gap: 8
  },
  retryText: { color: '#000', fontWeight: 'bold' },
  loadingContainer: { flex: 1, backgroundColor: BG_COLOR, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: GOLD, marginTop: 20, fontSize: 13, letterSpacing: 1 }
});

export const SafeView = (props: Props) => <ErrorBoundary {...props} />;
