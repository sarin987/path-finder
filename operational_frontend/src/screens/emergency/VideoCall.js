import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import {
  RTCPeerConnection,
  RTCView,
  mediaDevices,
  RTCIceCandidate,
  RTCSessionDescription,
} from 'react-native-webrtc';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../contexts/AuthContext';

const configuration = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
};

const VideoCall = ({ route, navigation }) => {
  const { contact } = route.params;
  const { user } = useAuth();
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  
  const peerConnection = useRef(null);

  useEffect(() => {
    startCall();
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (peerConnection.current) {
        peerConnection.current.close();
      }
    };
  }, []);

  const startCall = async () => {
    try {
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: 640,
          height: 480,
          frameRate: 30,
          facingMode: 'user',
        },
      });

      setLocalStream(stream);

      // Create and configure peer connection
      peerConnection.current = new RTCPeerConnection(configuration);

      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        peerConnection.current.addTrack(track, stream);
      });

      // Handle remote stream
      peerConnection.current.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
      };

      // Handle ICE candidates
      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          // Send ICE candidate to signaling server
          sendIceCandidate(event.candidate);
        }
      };

      // Create and send offer
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      
      // Send offer to signaling server
      sendOffer(offer);

    } catch (err) {
      console.error('Error starting call:', err);
    }
  };

  const sendOffer = (offer) => {
    // TODO: Implement sending offer through your signaling server
    socket.emit('offer', {
      offer,
      to: contact.id,
      from: user.id,
    });
  };

  const sendIceCandidate = (candidate) => {
    // TODO: Implement sending ICE candidate through your signaling server
    socket.emit('ice-candidate', {
      candidate,
      to: contact.id,
      from: user.id,
    });
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsCameraOff(!isCameraOff);
    }
  };

  const toggleSpeaker = () => {
    // TODO: Implement speaker toggle using native modules
    setIsSpeakerOn(!isSpeakerOn);
  };

  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnection.current) {
      peerConnection.current.close();
    }
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Remote Stream */}
      {remoteStream && (
        <RTCView
          streamURL={remoteStream.toURL()}
          style={styles.remoteStream}
          objectFit="cover"
        />
      )}

      {/* Local Stream */}
      {localStream && (
        <View style={styles.localStreamContainer}>
          <RTCView
            streamURL={localStream.toURL()}
            style={styles.localStream}
            objectFit="cover"
          />
        </View>
      )}

      {/* Call Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, isMuted && styles.controlButtonActive]}
          onPress={toggleMute}
        >
          <Icon
            name={isMuted ? 'microphone-off' : 'microphone'}
            size={24}
            color="white"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.endCallButton]}
          onPress={endCall}
        >
          <Icon name="phone-hangup" size={24} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, isCameraOff && styles.controlButtonActive]}
          onPress={toggleCamera}
        >
          <Icon
            name={isCameraOff ? 'camera-off' : 'camera'}
            size={24}
            color="white"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, !isSpeakerOn && styles.controlButtonActive]}
          onPress={toggleSpeaker}
        >
          <Icon
            name={isSpeakerOn ? 'volume-high' : 'volume-off'}
            size={24}
            color="white"
          />
        </TouchableOpacity>
      </View>

      {/* Contact Info */}
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{contact.name}</Text>
        <Text style={styles.callStatus}>Calling...</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  remoteStream: {
    flex: 1,
    backgroundColor: '#4a4a4a',
  },
  localStreamContainer: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 100,
    height: 150,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 5,
  },
  localStream: {
    flex: 1,
    backgroundColor: '#4a4a4a',
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  controlButtonActive: {
    backgroundColor: '#4B7BFF',
  },
  endCallButton: {
    backgroundColor: '#FF4B4B',
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  contactInfo: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  contactName: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  callStatus: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
  },
});

export default VideoCall;
