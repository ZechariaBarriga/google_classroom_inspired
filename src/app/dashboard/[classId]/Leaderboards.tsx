import { ClassType } from '@/utils/classUtils';
import React from 'react'

interface TabProps {
  current: ClassType;
}

function Leaderboards({ current }: TabProps) {
   const studentMap = new Map(
      current.members
         .filter((member) => member.role === "Student")
         .map((member) => [member.user_id, member])
   );

   
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {current.leaderboard
               ?.filter((item) => studentMap.has(item.user_id))
               ?.sort((a, b) => b.total_points - a.total_points)
               .map((item, index) => {
                  const student = studentMap.get(item.user_id);
                  return (
                  <tr key={item.user_id}>
                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{index + 1}
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student?.user.username || `User ${item.user_id}`}
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.total_points} pts
                     </td>
                  </tr>
                  );
               })}
            </tbody>

        </table>
      </div>
    </div>
  );
}

export default Leaderboards;