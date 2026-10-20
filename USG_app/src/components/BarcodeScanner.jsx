import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function BarcodeScanner({ visible, onClose, onScan, token }) {
  const { colors } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (visible) {
      setScanned(false);
      if (!permission?.granted) {
        requestPermission();
      }
    }
  }, [visible]);

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned || processing) return;
    
    setScanned(true);
    setProcessing(true);

    try {
      await onScan(data);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to process barcode');
    } finally {
      setProcessing(false);
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  const handleClose = () => {
    setScanned(false);
    setProcessing(false);
    onClose();
  };

  if (!permission) {
    return (
      <Modal visible={visible} animationType="slide" transparent={false}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={[styles.text, { color: colors.text }]}>Loading camera...</Text>
        </View>
      </Modal>
    );
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide" transparent={false}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <Ionicons name="camera-outline" size={64} color="#ef4444" />
          <Text style={[styles.text, { color: colors.text, marginTop: 20 }]}>
            Camera permission is required to scan barcodes
          </Text>
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, { backgroundColor: '#6b7280', marginTop: 10 }]} onPress={handleClose}>
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.scannerContainer}>
        {visible && permission?.granted ? (
          <>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              barcodeScannerSettings={{
                barcodeTypes: ['qr', 'code128', 'code39', 'ean13', 'ean8'],
              }}
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            />
            
            {/* Overlay on top of camera */}
            <View style={styles.overlay}>
              {/* Top Bar */}
              <View style={styles.topBar}>
                <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                  <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.title}>Scan Barcode</Text>
                <View style={{ width: 40 }} />
              </View>

              {/* Scanner Frame */}
              <View style={styles.scannerFrame}>
                <View style={styles.frameCorner} />
                <View style={[styles.frameCorner, styles.frameCornerTopRight]} />
                <View style={[styles.frameCorner, styles.frameCornerBottomLeft]} />
                <View style={[styles.frameCorner, styles.frameCornerBottomRight]} />
              </View>

              {/* Instructions */}
              <View style={styles.instructionsContainer}>
                {processing ? (
                  <>
                    <ActivityIndicator size="large" color="#10b981" />
                    <Text style={styles.instructions}>Processing...</Text>
                  </>
                ) : scanned ? (
                  <>
                    <Ionicons name="checkmark-circle" size={48} color="#10b981" />
                    <Text style={styles.instructions}>Barcode Scanned!</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="qr-code-outline" size={48} color="#fff" />
                    <Text style={styles.instructions}>
                      Position the barcode within the frame
                    </Text>
                    <Text style={[styles.instructions, { fontSize: 12, marginTop: 10 }]}>
                      {visible && permission?.granted ? 'Camera Active' : 'Camera Initializing...'}
                    </Text>
                  </>
                )}
              </View>
            </View>
          </>
        ) : (
          <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ActivityIndicator size="large" color="#10b981" />
            <Text style={[styles.text, { color: colors.text }]}>Initializing camera...</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  button: {
    marginTop: 30,
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: '#10b981',
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  scannerFrame: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  frameCorner: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderColor: '#10b981',
    borderTopWidth: 4,
    borderLeftWidth: 4,
    top: '30%',
    left: '15%',
  },
  frameCornerTopRight: {
    borderTopWidth: 4,
    borderLeftWidth: 0,
    borderRightWidth: 4,
    left: 'auto',
    right: '15%',
  },
  frameCornerBottomLeft: {
    borderTopWidth: 0,
    borderBottomWidth: 4,
    top: 'auto',
    bottom: '30%',
  },
  frameCornerBottomRight: {
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    top: 'auto',
    bottom: '30%',
    left: 'auto',
    right: '15%',
  },
  instructionsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  instructions: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 40,
  },
});
