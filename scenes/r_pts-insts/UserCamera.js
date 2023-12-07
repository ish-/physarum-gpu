import { VideoTexture } from 'three';

export default class UserCamera {
  constructor () {
    this.$video = document.createElement('video');
    document.body.append(this.$video);
    Object.assign(this.$video.style, { position: 'absolute', top: '-9999px' });
  }

  init () {
    return new Promise((resolve, reject) => {
      this.texture = new VideoTexture( this.$video );

      if ( navigator.mediaDevices && navigator.mediaDevices.getUserMedia ) {
        const constraints = { video: { width: 1280, height: 720, facingMode: 'user' } };
        navigator.mediaDevices.getUserMedia( constraints ).then(( stream ) => {
          this.$video.srcObject = stream;
          this.$video.play();
          resolve(this);
        } ).catch( err => {
          console.error('Unable to access the camera/webcam.', err);
          reject(err);
        });
      } else {
        const text = 'MediaDevices interface not available.';
        console.error(text);
        reject(text);
      }
    });
  }

  stop () {
    this.texture = null;
  }
}
