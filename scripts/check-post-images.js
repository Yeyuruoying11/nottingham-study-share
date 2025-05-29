const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

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

async function checkPosts() {
  try {
    const postsRef = collection(db, 'posts');
    const snapshot = await getDocs(postsRef);
    
    console.log('=== 帖子图片字段检查 ===');
    console.log('总帖子数:', snapshot.size);
    console.log('');
    
    let noImageCount = 0;
    let emptyImageCount = 0;
    let normalCount = 0;
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      const hasImage = data.image && data.image.trim() !== '';
      const hasImages = data.images && Array.isArray(data.images) && data.images.length > 0;
      
      if (!hasImage && !hasImages) {
        noImageCount++;
        console.log('❌ 无图片帖子:', {
          id: doc.id,
          title: data.title?.substring(0, 30) + '...',
          image: data.image,
          images: data.images,
          likes: data.likes || 0
        });
      } else if (data.image === '') {
        emptyImageCount++;
        console.log('⚠️  空图片字段:', {
          id: doc.id,
          title: data.title?.substring(0, 30) + '...',
          image: data.image,
          images: data.images?.length || 0,
          likes: data.likes || 0
        });
      } else {
        normalCount++;
        console.log('✅ 正常帖子:', {
          id: doc.id,
          title: data.title?.substring(0, 30) + '...',
          hasImage: hasImage,
          hasImages: hasImages,
          imageUrl: data.image ? data.image.substring(0, 50) + '...' : 'null',
          likes: data.likes || 0
        });
      }
    });
    
    console.log('');
    console.log('=== 统计 ===');
    console.log('无图片帖子数量:', noImageCount);
    console.log('空图片字段数量:', emptyImageCount);
    console.log('正常帖子数量:', normalCount);
    
    // 检查是否有点赞数特别高的帖子缺少图片
    console.log('');
    console.log('=== 点赞数检查 ===');
    let highLikedWithoutImage = 0;
    snapshot.forEach((doc) => {
      const data = doc.data();
      const hasImage = data.image && data.image.trim() !== '';
      const hasImages = data.images && Array.isArray(data.images) && data.images.length > 0;
      const likes = data.likes || 0;
      
      if (likes > 0 && !hasImage && !hasImages) {
        highLikedWithoutImage++;
        console.log('🔍 有点赞但无图片:', {
          id: doc.id,
          title: data.title?.substring(0, 30) + '...',
          likes: likes
        });
      }
    });
    
    console.log('有点赞但无图片的帖子数:', highLikedWithoutImage);
    
  } catch (error) {
    console.error('检查失败:', error);
  }
  
  process.exit(0);
}

checkPosts(); 