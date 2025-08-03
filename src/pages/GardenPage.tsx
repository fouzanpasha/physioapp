import { UserProgress } from '../types';

interface GardenPageProps {
  userProgress: UserProgress;
  onBack: () => void;
}

// Tree data interface
interface TreeData {
  id: string;
  height: number; // in meters
  streak: number;
  owner: string;
  isCurrentUser: boolean;
  position: { x: number; y: number };
}

// Achievement interface
interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

// Helper functions for tree visualization
const getTreeHeight = (streak: number): number => {
  if (streak === 0) return 0.5;
  if (streak <= 2) return 1.2;
  if (streak <= 4) return 2.8;
  if (streak <= 6) return 4.5;
  if (streak <= 10) return 6.2;
  if (streak <= 14) return 8.1;
  if (streak <= 18) return 12.5;
  if (streak <= 22) return 16.8;
  if (streak <= 25) return 20.2;
  return 25.0;
};

const getTreeStage = (streak: number): string => {
  if (streak === 0) return 'Seedling';
  if (streak <= 2) return 'Sprout';
  if (streak <= 4) return 'Sapling';
  if (streak <= 6) return 'Young Tree';
  if (streak <= 10) return 'Growing Tree';
  if (streak <= 14) return 'Mature Tree';
  return 'Ancient Tree';
};

// Generate organized floating island positions
const generateIslandPositions = (islandCount: number): { x: number; y: number }[] => {
  const positions = [];
  const spacing = 18; // Increased spacing between islands
  const baseY = 35; // Moved up slightly
  
  // Calculate total width needed
  const totalWidth = (islandCount - 1) * spacing;
  const startX = 15; // Start from left side with some margin
  
  for (let i = 0; i < islandCount; i++) {
    const x = startX + (i * spacing);
    // Keep all islands at same height for consistency
    positions.push({ x, y: baseY });
  }
  
  return positions;
};

// Generate mock friends data with organized positioning
const generateFriendsData = (userStreak: number): TreeData[] => {
  const friends = [
    { name: 'Alex Chen', streak: Math.floor(Math.random() * 20) + 1 },
    { name: 'Sarah Johnson', streak: Math.floor(Math.random() * 25) + 1 },
    { name: 'Mike Rodriguez', streak: Math.floor(Math.random() * 15) + 1 },
    { name: 'Emma Wilson', streak: Math.floor(Math.random() * 30) + 1 },
    { name: 'David Kim', streak: Math.floor(Math.random() * 18) + 1 },
    { name: 'Lisa Thompson', streak: Math.floor(Math.random() * 22) + 1 },
  ];

  const positions = generateIslandPositions(friends.length + 1); // +1 for user tree
  
  return friends.map((friend, index) => ({
    id: `friend-${index}`,
    height: getTreeHeight(friend.streak),
    streak: friend.streak,
    owner: friend.name,
    isCurrentUser: false,
    position: positions[index + 1] // Skip first position for user tree
  }));
};

// Generate achievements
const generateAchievements = (userProgress: UserProgress): Achievement[] => [
  {
    id: 'first-session',
    name: 'First Steps',
    description: 'Complete your first exercise session',
    icon: '🌱',
    unlocked: userProgress.totalSessions > 0
  },
  {
    id: 'streak-3',
    name: 'Consistency',
    description: 'Maintain a 3-day streak',
    icon: '🌿',
    unlocked: userProgress.dailyStreak >= 3
  },
  {
    id: 'streak-7',
    name: 'Dedication',
    description: 'Maintain a 7-day streak',
    icon: '🌳',
    unlocked: userProgress.dailyStreak >= 7
  },
  {
    id: 'streak-14',
    name: 'Unstoppable',
    description: 'Maintain a 14-day streak',
    icon: '🌲',
    unlocked: userProgress.dailyStreak >= 14
  },
  {
    id: 'level-5',
    name: 'Growing Strong',
    description: 'Reach level 5',
    icon: '⭐',
    unlocked: userProgress.level >= 5
  },
  {
    id: 'xp-1000',
    name: 'Experience Master',
    description: 'Earn 1000 XP',
    icon: '🏆',
    unlocked: userProgress.xp >= 1000,
    progress: userProgress.xp,
    maxProgress: 1000
  }
];

// Tree component with beautiful SVG graphics
const TreeComponent = ({ tree, position }: { tree: TreeData; position: { x: number; y: number } }) => {
  const baseHeight = 40; // Reduced base height
  const maxHeight = 120; // Reduced max height
  const treeHeight = baseHeight + (tree.height / 10.5) * (maxHeight - baseHeight);
  const trunkWidth = Math.max(6, treeHeight * 0.1);
  const foliageRadius = treeHeight * 0.35;
  
  // Different tree types based on height
  const getTreeType = (height: number) => {
    if (height <= 1.5) return 'sapling';
    if (height <= 3) return 'young';
    if (height <= 6) return 'mature';
    if (height <= 12) return 'tall';
    if (height <= 18) return 'giant';
    return 'ancient';
  };
  
  const treeType = getTreeType(tree.height);
  
  // Tree colors based on type
  const getTreeColors = (type: string) => {
    switch (type) {
      case 'sapling':
        return { trunk: '#8B4513', foliage: '#90EE90', highlight: '#98FB98' };
      case 'young':
        return { trunk: '#A0522D', foliage: '#32CD32', highlight: '#7CFC00' };
      case 'mature':
        return { trunk: '#654321', foliage: '#228B22', highlight: '#32CD32' };
      case 'tall':
        return { trunk: '#5D4037', foliage: '#2E7D32', highlight: '#4CAF50' };
      case 'giant':
        return { trunk: '#4E342E', foliage: '#1B5E20', highlight: '#388E3C' };
      case 'ancient':
        return { trunk: '#3E2723', foliage: '#0D4F14', highlight: '#1B5E20' };
      default:
        return { trunk: '#8B4513', foliage: '#32CD32', highlight: '#7CFC00' };
    }
  };
  
  const colors = getTreeColors(treeType);
  
  return (
    <div 
      className="absolute"
      style={{ 
        left: `${position.x}%`, 
        bottom: `calc(${position.y}% + 17.5px)`,
        transform: 'translateX(-50%)',
        zIndex: 15
      }}
    >
      {/* Tree Shadow */}
      <div 
        className="absolute bg-black bg-opacity-20 rounded-full blur-sm"
        style={{
          width: foliageRadius * 1.5,
          height: foliageRadius * 0.3,
          bottom: -10,
          left: '50%',
          transform: 'translateX(-50%)'
        }}
      />
      
      {/* Tree SVG */}
      <svg 
        width={foliageRadius * 2} 
        height={treeHeight} 
        viewBox={`0 0 ${foliageRadius * 2} ${treeHeight}`}
        style={{ 
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
        }}
      >
        {/* Tree trunk - positioned at bottom to touch island */}
        <ellipse
          cx={foliageRadius}
          cy={treeHeight - trunkWidth/2}
          rx={trunkWidth/2}
          ry={trunkWidth/2}
          fill={colors.trunk}
          stroke="#654321"
          strokeWidth="1"
        />
        
        {/* Main trunk - from bottom to foliage */}
        <rect
          x={foliageRadius - trunkWidth/2}
          y={foliageRadius}
          width={trunkWidth}
          height={treeHeight - foliageRadius - trunkWidth/2}
          fill={colors.trunk}
          stroke="#654321"
          strokeWidth="1"
        />
        
        {/* Tree foliage - positioned at top of trunk */}
        <circle
          cx={foliageRadius}
          cy={foliageRadius}
          r={foliageRadius}
          fill={colors.foliage}
          stroke="#228B22"
          strokeWidth="2"
        />
        
        {/* Highlight layer */}
        <circle
          cx={foliageRadius - foliageRadius * 0.2}
          cy={foliageRadius - foliageRadius * 0.2}
          r={foliageRadius * 0.6}
          fill={colors.highlight}
          opacity="0.7"
        />
        
        {/* Additional foliage details for larger trees */}
        {treeType !== 'sapling' && (
          <>
            <circle
              cx={foliageRadius + foliageRadius * 0.3}
              cy={foliageRadius - foliageRadius * 0.1}
              r={foliageRadius * 0.4}
              fill={colors.foliage}
              opacity="0.8"
            />
            <circle
              cx={foliageRadius - foliageRadius * 0.3}
              cy={foliageRadius + foliageRadius * 0.2}
              r={foliageRadius * 0.3}
              fill={colors.highlight}
              opacity="0.6"
            />
          </>
        )}
        
        {/* Tall tree details */}
        {treeType === 'tall' && (
          <>
            <circle
              cx={foliageRadius + foliageRadius * 0.4}
              cy={foliageRadius + foliageRadius * 0.1}
              r={foliageRadius * 0.35}
              fill={colors.foliage}
              opacity="0.9"
            />
            <circle
              cx={foliageRadius - foliageRadius * 0.4}
              cy={foliageRadius - foliageRadius * 0.2}
              r={foliageRadius * 0.3}
              fill={colors.highlight}
              opacity="0.7"
            />
            <circle
              cx={foliageRadius}
              cy={foliageRadius + foliageRadius * 0.3}
              r={foliageRadius * 0.25}
              fill={colors.foliage}
              opacity="0.8"
            />
          </>
        )}
        
        {/* Giant tree details */}
        {treeType === 'giant' && (
          <>
            <circle
              cx={foliageRadius + foliageRadius * 0.4}
              cy={foliageRadius + foliageRadius * 0.1}
              r={foliageRadius * 0.35}
              fill={colors.foliage}
              opacity="0.9"
            />
            <circle
              cx={foliageRadius - foliageRadius * 0.4}
              cy={foliageRadius - foliageRadius * 0.2}
              r={foliageRadius * 0.3}
              fill={colors.highlight}
              opacity="0.7"
            />
            <circle
              cx={foliageRadius}
              cy={foliageRadius + foliageRadius * 0.3}
              r={foliageRadius * 0.25}
              fill={colors.foliage}
              opacity="0.8"
            />
            <circle
              cx={foliageRadius + foliageRadius * 0.2}
              cy={foliageRadius - foliageRadius * 0.3}
              r={foliageRadius * 0.2}
              fill={colors.highlight}
              opacity="0.6"
            />
            <circle
              cx={foliageRadius - foliageRadius * 0.2}
              cy={foliageRadius + foliageRadius * 0.4}
              r={foliageRadius * 0.18}
              fill={colors.foliage}
              opacity="0.7"
            />
          </>
        )}
        
        {/* Ancient tree details */}
        {treeType === 'ancient' && (
          <>
            <circle
              cx={foliageRadius + foliageRadius * 0.4}
              cy={foliageRadius + foliageRadius * 0.1}
              r={foliageRadius * 0.35}
              fill={colors.foliage}
              opacity="0.9"
            />
            <circle
              cx={foliageRadius - foliageRadius * 0.4}
              cy={foliageRadius - foliageRadius * 0.2}
              r={foliageRadius * 0.3}
              fill={colors.highlight}
              opacity="0.7"
            />
            <circle
              cx={foliageRadius}
              cy={foliageRadius + foliageRadius * 0.3}
              r={foliageRadius * 0.25}
              fill={colors.foliage}
              opacity="0.8"
            />
            <circle
              cx={foliageRadius + foliageRadius * 0.2}
              cy={foliageRadius - foliageRadius * 0.3}
              r={foliageRadius * 0.2}
              fill={colors.highlight}
              opacity="0.6"
            />
            <circle
              cx={foliageRadius - foliageRadius * 0.2}
              cy={foliageRadius + foliageRadius * 0.4}
              r={foliageRadius * 0.18}
              fill={colors.foliage}
              opacity="0.7"
            />
            <circle
              cx={foliageRadius + foliageRadius * 0.5}
              cy={foliageRadius + foliageRadius * 0.2}
              r={foliageRadius * 0.15}
              fill={colors.highlight}
              opacity="0.5"
            />
            <circle
              cx={foliageRadius - foliageRadius * 0.5}
              cy={foliageRadius - foliageRadius * 0.1}
              r={foliageRadius * 0.12}
              fill={colors.foliage}
              opacity="0.6"
            />
          </>
        )}
      </svg>
      
      {/* Streak indicator - positioned above tree foliage */}
      <div 
        className="absolute left-1/2 transform -translate-x-1/2"
        style={{ 
          bottom: `${position.y}%`,
          transform: 'translateX(-50%) translateY(-100%)',
          marginBottom: `${treeHeight + 10}px`
        }}
      >
        <div className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold shadow-lg">
          {tree.streak}🔥
        </div>
      </div>
    </div>
  );
};

// Floating Island component
const FloatingIsland = ({ tree, position }: { tree: TreeData; position: { x: number; y: number } }) => {
  const islandWidth = 100;
  const islandHeight = 35;
  
  return (
    <div 
      className="absolute"
      style={{ 
        left: `${position.x}%`, 
        bottom: `${position.y}%`,
        transform: 'translateX(-50%)',
        zIndex: 10
      }}
    >
      {/* Island shadow */}
      <div 
        className="absolute bg-black bg-opacity-30 rounded-full blur-md"
        style={{
          width: islandWidth * 1.2,
          height: islandHeight * 0.4,
          bottom: -15,
          left: '50%',
          transform: 'translateX(-50%)'
        }}
      />
      
      {/* Main island */}
      <svg 
        width={islandWidth} 
        height={islandHeight} 
        viewBox={`0 0 ${islandWidth} ${islandHeight}`}
        style={{ filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.3))' }}
      >
        {/* Island base */}
        <ellipse
          cx={islandWidth/2}
          cy={islandHeight/2}
          rx={islandWidth/2 - 5}
          ry={islandHeight/2 - 5}
          fill="#8FBC8F"
          stroke="#556B2F"
          strokeWidth="2"
        />
        
        {/* Island texture layers */}
        <ellipse
          cx={islandWidth/2}
          cy={islandHeight/2 - 2}
          rx={islandWidth/2 - 8}
          ry={islandHeight/2 - 8}
          fill="#9ACD32"
          opacity="0.8"
        />
        
        <ellipse
          cx={islandWidth/2}
          cy={islandHeight/2 - 4}
          rx={islandWidth/2 - 12}
          ry={islandHeight/2 - 12}
          fill="#ADFF2F"
          opacity="0.6"
        />
        
        {/* Grass details */}
        <ellipse
          cx={islandWidth/2 - 15}
          cy={islandHeight/2 + 5}
          rx={8}
          ry={4}
          fill="#7CFC00"
          opacity="0.7"
        />
        
        <ellipse
          cx={islandWidth/2 + 20}
          cy={islandHeight/2 - 2}
          rx={6}
          ry={3}
          fill="#32CD32"
          opacity="0.8"
        />
        
        <ellipse
          cx={islandWidth/2 + 5}
          cy={islandHeight/2 + 8}
          rx={10}
          ry={5}
          fill="#90EE90"
          opacity="0.6"
        />
      </svg>
      
      {/* User name */}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-full text-center mt-2">
        <div className={`text-xs font-bold px-2 py-1 rounded-lg ${
          tree.isCurrentUser 
            ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-300' 
            : 'bg-white bg-opacity-90 text-gray-700'
        }`}>
          {tree.owner}
        </div>
        <div className="text-xs text-gray-600 mt-1">
          {tree.height.toFixed(1)}m
        </div>
      </div>
    </div>
  );
};


export default function GardenPage({ userProgress, onBack }: GardenPageProps) {
  // Generate organized island positions
  const islandPositions = generateIslandPositions(7); // 7 islands total (1 user + 6 friends)
  
  // Generate current user's tree data - positioned in center
  const currentUserTree: TreeData = {
    id: 'current-user',
    height: getTreeHeight(userProgress.dailyStreak),
    streak: userProgress.dailyStreak,
    owner: 'You',
    isCurrentUser: true,
    position: islandPositions[0] // Center position
  };

  // Generate friends' data
  const friendsData = generateFriendsData(userProgress.dailyStreak);
  
  // Combine all trees
  const allTrees = [currentUserTree, ...friendsData];
  
  // Generate achievements
  const achievements = generateAchievements(userProgress);
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div className="h-screen overflow-hidden relative bg-gradient-to-b from-sky-300 via-blue-200 to-purple-200">
      {/* Sky gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-400 via-blue-300 to-purple-100" />
      
      {/* Clouds */}
      <div className="absolute top-10 left-10 w-32 h-16 bg-white bg-opacity-30 rounded-full blur-sm animate-pulse" style={{ zIndex: 5 }} />
      <div className="absolute top-20 right-20 w-24 h-12 bg-white bg-opacity-20 rounded-full blur-sm animate-pulse" style={{ animationDelay: '2s', zIndex: 5 }} />
      <div className="absolute top-15 left-1/3 w-20 h-10 bg-white bg-opacity-25 rounded-full blur-sm animate-pulse" style={{ animationDelay: '4s', zIndex: 5 }} />
      
      {/* Header */}
      <div className="absolute top-4 left-4 right-4" style={{ zIndex: 30 }}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white drop-shadow-lg">
              Floating Islands
            </h1>
            <p className="text-white text-opacity-90 drop-shadow-md">
              Your recovery journey in the sky
            </p>
          </div>
          <button 
            onClick={onBack}
            className="px-6 py-3 bg-white bg-opacity-20 backdrop-blur-sm text-white rounded-full hover:bg-opacity-30 transition-all duration-300 shadow-lg"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Floating Islands container with trees and islands */}
      <div className="absolute inset-0 pt-20 pb-40" style={{ zIndex: 10 }}>
        <div className="relative w-full h-full">
          {/* Render floating islands */}
          {allTrees.map((tree) => (
            <FloatingIsland key={`island-${tree.id}`} tree={tree} position={tree.position} />
          ))}
          
          {/* Render trees on top of islands */}
          {allTrees.map((tree) => (
            <TreeComponent key={`tree-${tree.id}`} tree={tree} position={tree.position} />
          ))}
          
          {/* Floating particles for atmosphere */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white bg-opacity-30 rounded-full animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom panel with achievements and stats */}
      <div className="absolute bottom-0 left-0 right-0 bg-white bg-opacity-95 backdrop-blur-sm border-t border-indigo-200" style={{ zIndex: 25 }}>
        <div className="max-w-7xl mx-auto p-4">
          <div className="grid grid-cols-3 gap-6">
            {/* Your Tree Stats */}
            <div className="text-center">
              <h3 className="text-lg font-bold text-indigo-700 mb-2">Your Island</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Name:</span>
                  <span className="font-medium">{currentUserTree.owner}</span>
                </div>
                <div className="flex justify-between">
                  <span>Height:</span>
                  <span className="font-medium">{currentUserTree.height.toFixed(1)}m</span>
                </div>
                <div className="flex justify-between">
                  <span>Streak:</span>
                  <span className="font-medium">{currentUserTree.streak} days</span>
                </div>
                <div className="flex justify-between">
                  <span>Stage:</span>
                  <span className="font-medium">{getTreeStage(currentUserTree.streak)}</span>
                </div>
              </div>
            </div>

            {/* Achievements */}
            <div>
              <h3 className="text-lg font-bold text-indigo-700 mb-2 text-center">
                Achievements ({unlockedCount}/{achievements.length})
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {achievements.map((achievement) => (
                  <div 
                    key={achievement.id}
                    className={`text-center p-2 rounded-lg transition-all duration-300 ${
                      achievement.unlocked 
                        ? 'bg-indigo-100 border border-indigo-300' 
                        : 'bg-gray-100 border border-gray-200 opacity-50'
                    }`}
                  >
                    <div className="text-2xl mb-1">{achievement.icon}</div>
                    <div className="text-xs font-medium">{achievement.name}</div>
                    {achievement.progress && achievement.maxProgress && (
                      <div className="text-xs text-gray-600">
                        {achievement.progress}/{achievement.maxProgress}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Leaderboard */}
            <div>
              <h3 className="text-lg font-bold text-indigo-700 mb-2 text-center">Top Islands</h3>
              <div className="space-y-1">
                {allTrees
                  .sort((a, b) => b.height - a.height)
                  .slice(0, 5)
                  .map((tree, index) => (
                    <div key={tree.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-yellow-400 text-yellow-900' :
                          index === 1 ? 'bg-gray-300 text-gray-700' :
                          index === 2 ? 'bg-amber-600 text-white' :
                          'bg-gray-200 text-gray-600'
                        }`}>
                          {index + 1}
                        </span>
                        <span className={tree.isCurrentUser ? 'font-bold text-indigo-600' : ''}>
                          {tree.isCurrentUser ? 'You' : tree.owner}
                        </span>
                      </div>
                      <span className="text-gray-600">{tree.height.toFixed(1)}m</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}