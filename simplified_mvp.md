# Simplified MVP Blueprint - Core AI Task Coach 🚀

## 🎯 **MVP Overview**
**AI Personal Task Coach - Core Logic Focus**
- **Goal:** Clean workflows with intelligent task generation and feedback
- **Scope:** 3 workflows, simplified database, web interface
- **User Journey:** Goal setting → Daily AI-generated tasks → Evening reflection → Adaptive improvement

## 🗄️ **Simplified Database (PostgreSQL)**

### **Table 1: users**
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    goals TEXT NOT NULL,
    ideal_self_description TEXT,
    current_level VARCHAR(50) DEFAULT 'beginner',
    preferred_task_time TIME DEFAULT '08:00',
    created_at TIMESTAMP DEFAULT NOW()
);
```

### **Table 2: daily_tasks**
```sql
CREATE TABLE daily_tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    task_date DATE NOT NULL,
    task_1 TEXT NOT NULL,
    task_2 TEXT NOT NULL,
    task_3 TEXT NOT NULL,
    task_1_completed BOOLEAN DEFAULT NULL,
    task_2_completed BOOLEAN DEFAULT NULL,
    task_3_completed BOOLEAN DEFAULT NULL,
    task_1_difficulty INTEGER DEFAULT 5,
    task_2_difficulty INTEGER DEFAULT 5,
    task_3_difficulty INTEGER DEFAULT 5,
    ai_reasoning TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### **Table 3: user_progress**
```sql
CREATE TABLE user_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    date DATE NOT NULL,
    tasks_completed INTEGER DEFAULT 0,
    completion_rate FLOAT DEFAULT 0.0,
    user_feedback TEXT,
    energy_level INTEGER, -- 1-10 scale
    satisfaction_score INTEGER, -- 1-10 scale
    ai_adaptation_notes TEXT,
    streak_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔧 **Required n8n Setup**

### **Environment Variables:**
```
OPENAI_API_KEY=your_openai_key
POSTGRES_HOST=your_postgres_host
POSTGRES_DB=your_database_name
POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_db_password
WEBHOOK_SECRET=your_secret_key_for_security
```

## 🚀 **3 Core Workflows**

### **Workflow 1: Goal_Collection_And_User_Setup**
**Purpose:** Intelligent goal analysis and user profiling

```
Trigger: Webhook (User form submission)
URL: /webhook/setup-user

Nodes:
1. Webhook Trigger
   - Method: POST
   - Expected Data: {name, email, goals, ideal_self_description}

2. Set (Extract User Data)
   - name: {{ $json.name }}
   - email: {{ $json.email }}
   - goals: {{ $json.goals }}
   - ideal_self: {{ $json.ideal_self_description }}

3. OpenAI (Analyze Goals & Create Profile)
   - Model: gpt-4
   - System Prompt: 
```
You are an expert life coach and behavioral psychologist. Analyze the user's goals and ideal self description to create a personalized coaching profile.

User Goals: {{ $json.goals }}
Ideal Self: {{ $json.ideal_self }}

Please provide:
1. GOAL_ANALYSIS: Break down their goals into specific, measurable components
2. DIFFICULTY_ASSESSMENT: Rate their overall goal difficulty (beginner/intermediate/advanced)
3. MOTIVATION_PROFILE: Identify their core motivations and potential obstacles
4. TASK_STRATEGY: Recommend the best approach for daily task generation
5. SUCCESS_METRICS: How to measure progress effectively

Format as JSON:
{
  "goal_analysis": "detailed analysis",
  "difficulty_level": "beginner|intermediate|advanced", 
  "motivation_drivers": ["driver1", "driver2", "driver3"],
  "potential_obstacles": ["obstacle1", "obstacle2"],
  "recommended_task_types": ["type1", "type2", "type3"],
  "success_metrics": ["metric1", "metric2"],
  "coaching_notes": "personalized insights"
}
```

4. Code (Parse AI Analysis)
```javascript
const aiResponse = JSON.parse($input.first().json.choices[0].message.content);
const userData = $node["Set"].json;

return [{
  json: {
    name: userData.name,
    email: userData.email,
    goals: userData.goals,
    ideal_self_description: userData.ideal_self,
    current_level: aiResponse.difficulty_level,
    ai_profile: JSON.stringify(aiResponse),
    setup_complete: true
  }
}];
```

5. PostgreSQL (Save User Profile)
   - Operation: Insert
   - Table: users
   - Data: All user fields from previous node

6. PostgreSQL (Initialize Progress Tracking)
   - Operation: Insert
   - Table: user_progress
   - Query: 
```sql
INSERT INTO user_progress (user_id, date, streak_count, ai_adaptation_notes) 
VALUES ({{ $json.id }}, CURRENT_DATE, 0, 'User profile created: {{ $json.ai_profile }}')
```

7. HTTP Response
   - Status: 200
   - Body: {"status": "success", "message": "Profile created! Your first tasks will be generated shortly.", "user_id": {{ $json.id }}}
```

### **Workflow 2: Intelligent_Daily_Task_Generator**
**Purpose:** AI-powered adaptive task generation

```
Trigger: Schedule (Daily at 11:00 PM for next day preparation)
Cron: 0 23 * * *

Nodes:
1. Schedule Trigger

2. PostgreSQL (Get All Active Users)
   - Query: SELECT * FROM users WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'

3. PostgreSQL (Get User Progress History)
   - Query: 
```sql
SELECT 
    u.id, u.name, u.goals, u.ideal_self_description, u.current_level,
    AVG(up.completion_rate) as avg_completion_rate,
    AVG(up.energy_level) as avg_energy,
    AVG(up.satisfaction_score) as avg_satisfaction,
    COUNT(up.id) as total_days,
    MAX(up.streak_count) as max_streak,
    STRING_AGG(up.user_feedback, ' | ' ORDER BY up.date DESC LIMIT 5) as recent_feedback
FROM users u
LEFT JOIN user_progress up ON u.id = up.user_id 
WHERE u.id = {{ $json.id }}
GROUP BY u.id, u.name, u.goals, u.ideal_self_description, u.current_level
```

4. PostgreSQL (Get Recent Tasks Performance)
   - Query:
```sql
SELECT 
    task_1, task_2, task_3,
    task_1_completed, task_2_completed, task_3_completed,
    task_1_difficulty, task_2_difficulty, task_3_difficulty,
    ai_reasoning
FROM daily_tasks 
WHERE user_id = {{ $json.id }} 
ORDER BY task_date DESC 
LIMIT 7
```

5. OpenAI (Generate Adaptive Tasks)
   - Model: gpt-4
   - System Prompt:
```
You are an elite personal development coach with expertise in behavioral psychology, habit formation, and adaptive learning.

USER PROFILE:
- Name: {{ $json.name }}
- Goals: {{ $json.goals }}
- Ideal Self: {{ $json.ideal_self_description }}
- Experience Level: {{ $json.current_level }}

PERFORMANCE DATA:
- Average Completion Rate: {{ $json.avg_completion_rate || 0 }}%
- Average Energy Level: {{ $json.avg_energy || 5 }}/10
- Average Satisfaction: {{ $json.avg_satisfaction || 5 }}/10
- Total Active Days: {{ $json.total_days || 0 }}
- Max Streak: {{ $json.max_streak || 0 }}
- Recent Feedback: {{ $json.recent_feedback || "No feedback yet" }}

RECENT TASK PERFORMANCE:
{{ JSON.stringify($node["PostgreSQL2"].json) }}

Generate 3 perfectly calibrated daily tasks that:
1. Build incrementally toward their goals
2. Match their current performance level
3. Address any patterns in their feedback
4. Include variety to prevent monotony
5. Are specific, measurable, and time-bound

TASK DIFFICULTY CALIBRATION:
- If completion rate > 80%: Increase difficulty slightly
- If completion rate < 50%: Decrease difficulty and focus on fundamentals
- If satisfaction is low: Add more variety and intrinsic motivation
- If energy is low: Include energy-building activities

Respond in JSON format:
{
  "task_1": {
    "description": "specific actionable task",
    "duration": "estimated time",
    "difficulty": 1-10,
    "goal_connection": "how this advances their goals",
    "motivation_hook": "why this will feel rewarding"
  },
  "task_2": {
    "description": "specific actionable task", 
    "duration": "estimated time",
    "difficulty": 1-10,
    "goal_connection": "how this advances their goals",
    "motivation_hook": "why this will feel rewarding"
  },
  "task_3": {
    "description": "specific actionable task",
    "duration": "estimated time", 
    "difficulty": 1-10,
    "goal_connection": "how this advances their goals",
    "motivation_hook": "why this will feel rewarding"
  },
  "ai_reasoning": "explanation of task selection and calibration strategy",
  "adaptation_strategy": "how these tasks adapt to their recent performance",
  "success_prediction": "confidence level for completion (1-10)"
}
```

6. Code (Process AI Response)
```javascript
const aiTasks = JSON.parse($input.first().json.choices[0].message.content);
const userData = $node["PostgreSQL"].json;

return [{
  json: {
    user_id: userData.id,
    user_name: userData.name,
    task_date: new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0], // Tomorrow
    task_1: aiTasks.task_1.description,
    task_2: aiTasks.task_2.description,
    task_3: aiTasks.task_3.description,
    task_1_difficulty: aiTasks.task_1.difficulty,
    task_2_difficulty: aiTasks.task_2.difficulty,
    task_3_difficulty: aiTasks.task_3.difficulty,
    ai_reasoning: aiTasks.ai_reasoning,
    motivation_context: JSON.stringify({
      task_1_motivation: aiTasks.task_1.motivation_hook,
      task_2_motivation: aiTasks.task_2.motivation_hook,
      task_3_motivation: aiTasks.task_3.motivation_hook,
      adaptation_strategy: aiTasks.adaptation_strategy,
      success_prediction: aiTasks.success_prediction
    })
  }
}];
```

7. PostgreSQL (Save Generated Tasks)
   - Operation: Insert
   - Table: daily_tasks
   - Data: All task fields from previous node

8. HTTP Response (Return Tasks)
   - Status: 200
   - Body: Generated tasks with motivation context
```

### **Workflow 3: Evening_Reflection_And_Adaptive_Feedback**
**Purpose:** Intelligent progress tracking and next-day optimization

```
Trigger: Webhook (User evening check-in)
URL: /webhook/evening-checkin

Nodes:
1. Webhook Trigger
   - Expected Data: {user_id, task_1_completed, task_2_completed, task_3_completed, energy_level, satisfaction_score, user_feedback}

2. Set (Extract Check-in Data)
   - user_id: {{ $json.user_id }}
   - completions: [{{ $json.task_1_completed }}, {{ $json.task_2_completed }}, {{ $json.task_3_completed }}]
   - energy_level: {{ $json.energy_level }}
   - satisfaction_score: {{ $json.satisfaction_score }}
   - user_feedback: {{ $json.user_feedback }}

3. PostgreSQL (Get Today's Tasks)
   - Query:
```sql
SELECT * FROM daily_tasks 
WHERE user_id = {{ $json.user_id }} AND task_date = CURRENT_DATE
```

4. PostgreSQL (Update Task Completions)
   - Query:
```sql
UPDATE daily_tasks 
SET 
    task_1_completed = {{ $json.task_1_completed }},
    task_2_completed = {{ $json.task_2_completed }},
    task_3_completed = {{ $json.task_3_completed }}
WHERE user_id = {{ $json.user_id }} AND task_date = CURRENT_DATE
```

5. Code (Calculate Progress Metrics)
```javascript
const checkIn = $node["Set"].json;
const tasks = $node["PostgreSQL"].json;

const completedCount = [checkIn.task_1_completed, checkIn.task_2_completed, checkIn.task_3_completed]
  .filter(Boolean).length;

const completionRate = (completedCount / 3) * 100;

// Simple streak calculation
const isFullCompletion = completedCount === 3;

return [{
  json: {
    user_id: checkIn.user_id,
    date: new Date().toISOString().split('T')[0],
    tasks_completed: completedCount,
    completion_rate: completionRate,
    user_feedback: checkIn.user_feedback,
    energy_level: checkIn.energy_level,
    satisfaction_score: checkIn.satisfaction_score,
    is_streak_day: isFullCompletion,
    performance_summary: `${completedCount}/3 tasks completed (${completionRate.toFixed(1)}%)`
  }
}];
```

6. PostgreSQL (Get Previous Streak)
   - Query:
```sql
SELECT streak_count FROM user_progress 
WHERE user_id = {{ $json.user_id }} 
ORDER BY date DESC 
LIMIT 1
```

7. Code (Update Streak Count)
```javascript
const progress = $node["Code"].json;
const previousStreak = $node["PostgreSQL2"].json?.streak_count || 0;

const newStreak = progress.is_streak_day ? previousStreak + 1 : 0;

return [{
  json: {
    ...progress,
    streak_count: newStreak,
    streak_milestone: newStreak > 0 && newStreak % 7 === 0 ? `🎉 ${newStreak} day streak!` : null
  }
}];
```

8. PostgreSQL (Save Progress Data)
   - Operation: Insert
   - Table: user_progress
   - Data: All progress fields

9. OpenAI (Generate Personalized Feedback)
   - Model: gpt-4
   - System Prompt:
```
You are a supportive and insightful personal development coach. Generate encouraging, personalized feedback for the user's daily progress.

TODAY'S PERFORMANCE:
- Tasks Completed: {{ $json.tasks_completed }}/3
- Completion Rate: {{ $json.completion_rate }}%
- Energy Level: {{ $json.energy_level }}/10
- Satisfaction: {{ $json.satisfaction_score }}/10
- User Feedback: "{{ $json.user_feedback }}"
- Current Streak: {{ $json.streak_count }} days

TASK DETAILS:
{{ JSON.stringify($node["PostgreSQL"].json) }}

Generate supportive feedback that:
1. Acknowledges their effort regardless of completion rate
2. Identifies patterns and insights
3. Provides specific encouragement
4. Suggests gentle improvements for tomorrow
5. Celebrates streaks and milestones

Keep it positive, personal, and actionable. Respond in JSON:
{
  "feedback_message": "encouraging and insightful message",
  "key_insight": "main observation about their progress",
  "tomorrow_suggestion": "specific recommendation for improvement",
  "celebration": "positive reinforcement or milestone recognition"
}
```

10. HTTP Response (Send Feedback to User)
    - Status: 200
    - Body: AI feedback + progress summary
```

## 🎯 **Simple Testing Interface**

Create a basic HTML form for testing:

```html
<!-- Goal Setup Form -->
<form action="https://your-n8n-instance.com/webhook/setup-user" method="POST">
  <input name="name" placeholder="Your Name" required>
  <input name="email" placeholder="Email" required>
  <textarea name="goals" placeholder="Your main goals (e.g., get fit, learn coding, build habits)" required></textarea>
  <textarea name="ideal_self_description" placeholder="Describe your ideal self in 6 months" required></textarea>
  <button type="submit">Create My AI Coach</button>
</form>

<!-- Evening Check-in Form -->
<form action="https://your-n8n-instance.com/webhook/evening-checkin" method="POST">
  <input name="user_id" placeholder="User ID" required>
  <label>Task 1 Complete: <input type="checkbox" name="task_1_completed" value="true"></label>
  <label>Task 2 Complete: <input type="checkbox" name="task_2_completed" value="true"></label>
  <label>Task 3 Complete: <input type="checkbox" name="task_3_completed" value="true"></label>
  <input name="energy_level" type="range" min="1" max="10" placeholder="Energy Level (1-10)">
  <input name="satisfaction_score" type="range" min="1" max="10" placeholder="Satisfaction (1-10)">
  <textarea name="user_feedback" placeholder="How did today go? Any thoughts?"></textarea>
  <button type="submit">Submit Daily Reflection</button>
</form>
```

## ✅ **MVP Success Criteria**
- [ ] User can input goals and get AI analysis
- [ ] AI generates 3 personalized daily tasks
- [ ] User can complete evening reflection
- [ ] System adapts future tasks based on performance
- [ ] Intelligent feedback and encouragement system
- [ ] Progressive difficulty adjustment

## 🚀 **Quick Implementation Plan**
1. **Hour 1:** Set up database and basic webhooks
2. **Hour 2:** Build goal collection workflow with OpenAI
3. **Hour 3:** Create intelligent task generator
4. **Hour 4:** Build evening reflection system
5. **Hour 5:** Test complete user journey
6. **Hour 6:** Polish AI prompts and add error handling

**Ready to build intelligent workflows!** 🤖✨ 