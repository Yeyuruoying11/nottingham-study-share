const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: 'AIzaSyBLxCAIw1BjHWoVekUW9yj7i3P6_HMWpO4',
  authDomain: 'guidin-db601.firebaseapp.com',
  projectId: 'guidin-db601',
  storageBucket: 'guidin-db601.firebasestorage.app',
  messagingSenderId: '831633555817',
  appId: '1:831633555817:web:cf598c871c41f83a4dfdf8'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkSpecificPost() {
  try {
    const postId = '0fVbjYqqgtOelN9DC546'; // 有多图片的帖子
    const docRef = doc(db, 'posts', postId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('=== 详细帖子信息 ===');
      console.log('标题:', data.title);
      console.log('图片字段 (image):', data.image || 'null');
      console.log('多图片字段 (images):');
      if (data.images && Array.isArray(data.images)) {
        console.log('  数组长度:', data.images.length);
        data.images.forEach((img, index) => {
          console.log(`  图片 ${index + 1}:`, img);
        });
      } else {
        console.log('  ', data.images);
      }
      console.log('点赞数:', data.likes || 0);
      console.log('点赞用户:', data.likedBy || []);
      
      // 模拟前端显示逻辑
      console.log('');
      console.log('=== 前端显示逻辑模拟 ===');
      const willShowCarousel = data.images && data.images.length > 1;
      console.log('显示轮播条件 (images && images.length > 1):', willShowCarousel);
      if (willShowCarousel) {
        console.log('-> 将显示 ThreeDPhotoCarousel');
      } else {
        console.log('-> 将显示单张图片:', data.image || '空');
        if (!data.image || data.image.trim() === '') {
          console.log('⚠️ 警告: 单张图片字段为空，可能不显示图片！');
        }
      }
    } else {
      console.log('帖子不存在');
    }
  } catch (error) {
    console.error('检查失败:', error);
  }
  
  process.exit(0);
}

checkSpecificPost(); 