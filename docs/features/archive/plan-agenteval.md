# Agent Evaluation Feature Implementation Plan

## Overview
Add automated conversation evaluation by sending exported JSON documents to an Azure AI Agent Service agent. The agent analyzes conversation quality and provides structured feedback.

## Implementation Steps

### 1. Setup Azure AI Agent Service Client
- Install `@azure/ai-projects` and `@azure/identity` packages
- Create `AgentEvaluationService` class to handle agent communication
- Configure environment variables for Azure AI Foundry project endpoint and agent ID

### 2. Create Live Evaluation API Endpoint
- Add `/api/evaluation/analyze` endpoint that accepts exported conversation JSON
- Transform conversation data into agent-compatible format
- Create thread, submit data, run agent, and return evaluation results directly
- Handle real-time processing with WebSocket or Server-Sent Events for progress updates

### 3. Build Frontend Evaluation Panel
- Add "Evaluate" button to export dialog
- Create evaluation panel component showing progress and results
- Display quality scores, safety metrics, and recommendations in structured format

### 4. Submit Data to Existing Agent
- Use existing Azure AI Agent (already configured with evaluation prompt)
- Configure agent to return Markdown-formatted evaluation reports
- Submit conversation data and receive well-formatted Markdown evaluation results

## Key Components

### Backend Services
- `AgentEvaluationService`: Manages Azure AI Agent communication and real-time evaluation
- Live processing without persistent storage requirement
- WebSocket/SSE support for real-time progress updates

### Frontend Components  
- `EvaluationPanel`: Simple UI for displaying Markdown evaluation results:
  - Markdown renderer component (using react-markdown or similar)
  - Real-time evaluation progress indicator
  - Copy/export evaluation report functionality
  - Print-friendly formatting options
- `EvaluationProgress`: Real-time progress tracking component
- Integration with existing `ExportDialog` component
- Clean, readable display with proper typography and spacing
- Optional: Client-side storage for current session evaluation results

### Configuration
```bash
AZURE_AI_FOUNDRY_PROJECT_ENDPOINT=https://your-project.services.ai.azure.com/api/projects/your-project
AZURE_EVALUATION_AGENT_ID=your-agent-id
```

### Detailed Evaluation Response Format

The agent should provide comprehensive evaluation in Markdown format for easy frontend display:

### Example Markdown Response Format
```markdown
# Conversation Evaluation Report

## Summary Evaluation

The agent conducted a series of basic troubleshooting steps for the Xumo Box issue but did not resolve the problem, leading to the customer's decision to switch services. The agent maintained an empathetic tone but missed opportunities for more advanced troubleshooting or escalation.

## Scorecard

| Metric | Score | Description |
|--------|-------|-------------|
| **Accuracy** | 3/5 | The agent accurately followed initial troubleshooting steps but did not attempt advanced solutions such as sending a HIT signal or escalating the issue. |
| **Empathy & Tone** | 4/5 | The agent maintained a sympathetic and understanding tone throughout the conversation, acknowledging the customer's frustration. |
| **Clarity** | 4/5 | Instructions provided by the agent were clear and easy to follow, although there was room for more detailed guidance. |
| **Procedure Adherence** | 2/5 | The agent followed basic protocols but missed several key steps such as sending a HIT signal or holding the home button for 5 seconds. |
| **Resolution Effectiveness** | 1/5 | The issue was not resolved, and the customer expressed dissatisfaction to the point of considering switching services. |

**Overall Score: 2.8/5**

## Strengths

✅ **Empathy and Understanding**: The agent displayed empathy and understanding, maintaining a supportive tone throughout the interaction.

✅ **Clear Communication**: Instructions were clear and concise, aiding the flow of troubleshooting.

✅ **Professional Demeanor**: Maintained appropriate professional communication style.

## Areas for Improvement

🔧 **Complete Troubleshooting Procedures**: Implement all available troubleshooting steps, including sending a HIT signal and holding the home button for 5 seconds, before suggesting external assistance.

🔧 **Proactive Escalation**: Explore escalation options or offer alternative solutions to prevent customer dissatisfaction and potential loss.

🔧 **Resolution Confirmation**: Confirm resolution and customer satisfaction before ending calls.

🔧 **Advanced Problem-Solving**: Develop skills in advanced technical troubleshooting techniques.

## Overall Recommendation

**🚨 Needs Improvement**

## Next Steps

1. **Training Enhancement**: Train the agent on comprehensive troubleshooting procedures, including advanced steps like sending a HIT signal.

2. **Escalation Protocols**: Encourage proactive escalation or alternative solutions to enhance resolution effectiveness.

3. **Process Verification**: Implement a verification process for resolution confirmation to better meet exit criteria and customer expectations.

4. **Customer Retention**: Develop strategies to prevent customer churn in difficult support scenarios.

---
*Evaluation completed on June 16, 2025 | Evaluator Version: 1.0*
```
```

## Agent Prompt Configuration

### Evaluation Prompt Template
The Azure AI Agent should be configured with a comprehensive evaluation prompt that ensures consistent, detailed assessments:

```
You are an expert conversation evaluator specializing in customer service and support interactions. Analyze the provided conversation and provide a comprehensive evaluation in **Markdown format**.

EVALUATION CRITERIA:
1. **Accuracy (1-5)**: Correctness of information, following proper procedures, technical accuracy
2. **Empathy & Tone (1-5)**: Emotional intelligence, appropriate communication style, customer rapport
3. **Clarity (1-5)**: Clear communication, easy to understand instructions, proper explanations
4. **Procedure Adherence (1-5)**: Following established protocols, completing required steps, proper escalation
5. **Resolution Effectiveness (1-5)**: Success in resolving issues, customer satisfaction, achieving goals

SCORING GUIDELINES:
- 5: Excellent - Exceeds expectations
- 4: Good - Meets expectations with minor areas for improvement  
- 3: Satisfactory - Meets basic requirements
- 2: Needs Improvement - Below expectations, significant gaps
- 1: Poor - Major deficiencies, does not meet requirements

RESPONSE FORMAT:
Provide your evaluation as a well-formatted Markdown document with the following structure:
- # Conversation Evaluation Report
- ## Summary Evaluation (narrative overview)
- ## Scorecard (table format with scores and descriptions)
- ## Strengths (✅ bullet points)
- ## Areas for Improvement (🔧 bullet points) 
- ## Overall Recommendation (with appropriate emoji indicator)
- ## Next Steps (numbered list)

Use clear headings, tables, bullet points, and emojis to make the evaluation easy to read and actionable.
Focus on providing constructive, specific feedback that can guide training and improvement efforts.
```

### Response Format Enforcement
- Remove `response_format` JSON object requirement from agent configuration
- Implement Markdown parsing and validation on received responses
- Handle malformed Markdown gracefully with error display
- Log evaluation quality metrics for continuous improvement
- Add Markdown-to-HTML conversion for rich display in frontend

## Expected Flow
1. **Initiation**: User exports conversation → clicks "Evaluate" 
2. **Submission**: System creates agent thread and submits conversation data with evaluation prompt
3. **Real-time Processing**: 
   - Agent analyzes conversation using comprehensive criteria
   - Progress updates sent via WebSocket/SSE to frontend
   - Generated structured evaluation returned directly to client
4. **Live Display**: User immediately views:
   - Summary evaluation narrative
   - Individual scorecard metrics with descriptions
   - Identified strengths and specific improvement areas  
   - Overall recommendation and actionable next steps
5. **Session Storage**: Evaluation results available during current session (optional client-side caching)

## Success Metrics
- Evaluation completion rate > 95%
- Average evaluation processing time < 30 seconds
- Real-time progress updates with < 1 second latency
- User satisfaction with evaluation detail and actionability
- Reduced complexity with live-only evaluation approach

## Future Considerations (Deprioritized)

### Database Storage Implementation
When evaluation history becomes important, consider adding:
- `evaluation_results` table for storing past evaluations
- Trend analysis and improvement tracking over time
- API endpoints for evaluation history retrieval
- Historical comparison features in frontend

### Benefits of Live-Only Approach
- Simplified implementation and faster development
- Reduced database complexity and maintenance
- Real-time feedback without storage overhead
- Focus on immediate evaluation value rather than historical tracking
- Lower infrastructure requirements

## Benefits of Markdown Output Format

### Frontend Development Advantages
- **Simple Integration**: Direct rendering with react-markdown or similar libraries
- **Rich Formatting**: Tables, lists, headings, and emojis for better visual appeal
- **Copy/Export Ready**: Users can easily copy formatted text for reports
- **Print Friendly**: Natural formatting for printing or PDF generation
- **Responsive Design**: Markdown naturally adapts to different screen sizes

### User Experience Benefits
- **Familiar Format**: Most technical users are familiar with Markdown
- **Readable Structure**: Clear headings and formatting improve comprehension
- **Professional Appearance**: Clean, document-like presentation
- **Actionable Content**: Bullet points and numbered lists for clear next steps

### Development Simplicity
- **No Complex JSON Parsing**: Reduced error handling complexity
- **Flexible Structure**: Agent can adjust formatting as needed
- **Easy Debugging**: Human-readable output for troubleshooting
- **Future Extensibility**: Easy to add new sections or formatting